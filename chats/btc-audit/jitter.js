// ledgerReplayNoiseSim.js ----------------------------------------------------

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const crypto = require('crypto');

/* ----------------------------------------------------------------------
   1️⃣  Deterministic thermal‑noise generator (Eq. 1)
   ---------------------------------------------------------------------- */
const N_FREQ = 7;               // how many spectral components
const F_MAX = 8e6;              // 8 MHz – well above the RO fundamental
const SAMPLE_RATE = 1e9;        // we work in picosecond resolution

// Fixed parameters – change them to emulate “future drift”
const amplitudes = [0.28, 0.21, 0.15, 0.12, 0.09, 0.07, 0.05]; // V (peak)
const phasesA    = [0.0, 0.9, 2.1, 4.2, 5.6, 1.2, 3.4];        // rad
const phasesB    = [1.7, 0.3, 3.9, 2.5, 6.0, 4.4, 5.0];        // rad

function noise(t, phases) {
    let v = 0;
    for (let i = 0; i < N_FREQ; ++i) {
        const f = (i + 1) * (F_MAX / N_FREQ);  // evenly spaced
        v += amplitudes[i] * Math.cos(2 * Math.PI * f * t + phases[i]);
    }
    return v; // volts, deterministic
}

/* ----------------------------------------------------------------------
   2️⃣  Ring‑oscillator jitter (Eq. 4‑5)
   ---------------------------------------------------------------------- */
const T0 = 12.5e-9;       // nominal period 80 MHz
const ALPHA = 15e-12;     // 15 ps per volt (typical for 130 nm)
const STEPS = 50000;      // how many edges we generate per ring

function generateEdgeTimes(phases) {
    const times = new Float64Array(STEPS);
    let t = 0;
    for (let n = 0; n < STEPS; ++n) {
        const v = noise(t, phases);               // deterministic voltage
        const T = T0 + ALPHA * v;                 // jittered period
        t += T;
        times[n] = t;
    }
    return times;
}
const edgesA = generateEdgeTimes(phasesA);
const edgesB = generateEdgeTimes(phasesB);

/* ----------------------------------------------------------------------
   3️⃣  Phase‑difference accumulator
   ---------------------------------------------------------------------- */
const ACC_BITS = 16;
const ACC_MAX = 1 << (ACC_BITS - 1);
function simulateAccumulator(fs) {
    const dtSample = 1 / fs;               // sampling interval seconds
    const rawBits = [];                    // 1‑bit raw stream

    let idxA = 0, idxB = 0;
    let nextA = edgesA[0], nextB = edgesB[0];
    let acc = 0;                           // signed 16‑bit
    let now = 0;

    while (rawBits.length < 20000) {      // generate enough bits for extractor
        // ---- advance to next sampling instant -----------------
        const sampleTime = now + dtSample;
        while (nextA <= sampleTime || nextB <= sampleTime) {
            if (nextA <= nextB) {
                acc = ((acc + 1 + 0x8000) & 0xFFFF) - 0x8000; // keep signed
                ++idxA;
                nextA = edgesA[idxA] ?? Infinity;
            } else {
                acc = ((acc - 1 + 0x8000) & 0xFFFF) - 0x8000;
                ++idxB;
                nextB = edgesB[idxB] ?? Infinity;
            }
        }
        now = sampleTime;

        // ---- 1‑bit ADC (mid‑scale threshold) --------------------
        // map signed acc (-32768..32767) → voltage (-Vref..+Vref)
        const Vref = 1.2; // V
        const V = (acc / ACC_MAX) * Vref;
        const bit = V > 0 ? 1 : 0;
        rawBits.push(bit);
    }
    return rawBits;
}

/* ----------------------------------------------------------------------
   4️⃣  Von‑Neumann extractor + XOR‑fold
   ---------------------------------------------------------------------- */
function vonNeumann(bits) {
    const out = [];
    for (let i = 0; i + 1 < bits.length; i += 2) {
        const a = bits[i];
        const b = bits[i + 1];
        if (a !== b) out.push(a);
    }
    return out;
}

function xorFold(bits) {
    const out = Buffer.alloc(32, 0);
    for (let i = 0; i < bits.length; ++i) {
        const byteIdx = (i >>> 3) % 32;
        const bitIdx  = i & 7;
        out[byteIdx] ^= (bits[i] << bitIdx);
    }
    return out;
}

/* ----------------------------------------------------------------------
   5️⃣  Full pipeline
   ---------------------------------------------------------------------- */
function runSimulation({fs = 3000}) {
    const raw = simulateAccumulator(fs);
    const vn  = vonNeumann(raw);
    const buf = xorFold(vn);
    const seed = crypto.createHash('sha256').update(buf).digest('hex');
    return {
        fs : fs,
        rawLen   : raw.length,
        vnLen    : vn.length,
        bufHex   : buf.toString('hex'),
        seedHex  : seed,
        entropyRate : vn.length / (raw.length/2)   // approx bits per raw pair
    };
}

/* ----------------------------------------------------------------------
   6️⃣  Example run
   ---------------------------------------------------------------------- */
const result = runSimulation({fs: 3200});
console.log('--- Ledger‑Replay‑Noise deterministic model ---');
console.log('Sampling freq (kHz) :', (result.fs/1000).toFixed(1));
console.log('Raw bits generated  :', result.rawLen);
console.log('Von‑Neumann out bits:', result.vnLen);
console.log('XOR‑fold (32‑byte)  :', result.bufHex);
console.log('Final SHA‑256 seed   :', result.seedHex);
console.log('Estimated entropy per raw pair ≈', result.entropyRate.toFixed(3), 'bits');
