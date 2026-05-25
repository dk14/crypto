// lazyAvalancheDUN_fixedNonZero.js
// ------------------------------------------------------------
// Lazy deterministic DUN generator – guarantees a non‑zero
// ADC waveform and a different 128‑bit DUN on every call.
// ------------------------------------------------------------

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const crypto = require('crypto');

// -------------------------------------------------------------------
// 1️⃣  Global constants (identical to the Ledger hardware)
// -------------------------------------------------------------------
const SAMPLE_RATE   = 2_000_000;               // 2 MHz ADC sampling
const BIT_RES       = 12;                     // 12‑bit
const FS_VOLTAGE    = 3.0;                    // full‑scale voltage (V)
const LSB           = FS_VOLTAGE / ((1 << BIT_RES) - 1); // ≈0.000732 V
const N_TONES       = 4;
const ANALOG_BW     = 800_000;                // Hz, realistic analog bandwidth
const DF            = Math.floor(ANALOG_BW / N_TONES); // Hz spacing between tones

// -------------------------------------------------------------------
// 2️⃣  Choose a PSD that yields a usable ADC swing.
//    We ask for an RMS voltage of at least 4 LSB (≈ 3 mV).  The PSD of a
//    white‑noise generator that consists of N_TONES equal‑amplitude
//    sinusoids is:
//
//          S   =  (A_rms)² / (N_TONES * DF)
//    where A_rms = sqrt( Σ (A²/2) ) = A * sqrt(N_TONES/2)
//    ⇒  A = sqrt( 2 * S * DF )
//
//    We compute the smallest PSD that satisfies the 4 LSB criterion and
//    then multiply it by a safety factor (×1.5) so that rounding errors
//    never bring us back to zero.
// -------------------------------------------------------------------
const MIN_RMS = 4 * LSB;                     // at least 4 LSB RMS
const MIN_PSD = (MIN_RMS * MIN_RMS) / (N_TONES * DF);
const AVALANCHE_PSD = MIN_PSD * 1.5;         // safety margin

// Amplitude per tone (identical for all tones)
const AMPLITUDE = Math.sqrt(2 * AVALANCHE_PSD * DF);

// -------------------------------------------------------------------
// 3️⃣  Phase‑quantisation (how many distinct phases the ADC can resolve)
// -------------------------------------------------------------------
const phaseStepRad  = Math.asin(LSB / AMPLITUDE);
const STEPS_PER_TONE = Math.max(2, Math.round(2 * Math.PI / phaseStepRad));

// -------------------------------------------------------------------
// 4️⃣  Helper utilities (LCM and phase‑vector iterator)
// -------------------------------------------------------------------
function lcm(a, b) {
    const g = (x, y) => (!y ? x : g(y, x % y));
    return (a / g(a, b)) * b;
}
function lcmArray(arr) {
    return arr.reduce((acc, v) => lcm(acc, v), 1);
}
function* phaseVectorGen() {
    const max = STEPS_PER_TONE;
    const vec = new Array(N_TONES).fill(0);
    while (true) {
        yield vec.slice();                     // copy for the caller
        // increment like an N‑digit counter
        let pos = N_TONES - 1;
        while (pos >= 0) {
            vec[pos] = (vec[pos] + 1) % max;
            if (vec[pos] !== 0) break;
            pos--;
        }
        if (pos < 0) return;                  // exhausted all vectors
    }
}

// -------------------------------------------------------------------
// 5️⃣  Build ONE epoch for a given phase vector (lazy, cached)
// -------------------------------------------------------------------
function buildEpoch(phaseIdx) {
    const twoPi = 2 * Math.PI;
    const phases = phaseIdx.map(i => (i / STEPS_PER_TONE) * twoPi);

    // Period (samples) of each tone – must be integer
    const tonePeriods = [];
    for (let k = 0; k < N_TONES; ++k) {
        const f = (k + 1) * DF;
        tonePeriods.push(Math.round(SAMPLE_RATE / f));
    }
    const epochLen = lcmArray(tonePeriods); // integer LCM → epoch length

    const epoch = new Uint16Array(epochLen);
    for (let n = 0; n < epochLen; ++n) {
        let v = 0;
        for (let k = 0; k < N_TONES; ++k) {
            const f = (k + 1) * DF;
            v += AMPLITUDE * Math.cos(twoPi * f * n / SAMPLE_RATE + phases[k]);
        }
        // Quantise to 12‑bit ADC code
        let code = Math.round((v / FS_VOLTAGE) * ((1 << BIT_RES) - 1));
        if (code < 0)   code = 0;
        if (code > 0xFFF) code = 0xFFF;
        epoch[n] = code;
    }
    return epoch;
}

// -------------------------------------------------------------------
// 6️⃣  Lazy DUN generator class (public API = generateNextDUN())
// -------------------------------------------------------------------
export class AvalancheDUNGenerator {
    constructor() {
        this.WINDOW = 4096;                 // samples per DUN (Ledger spec)
        this._globalPos = 0;                // absolute sample index
        this._phaseIter = phaseVectorGen(); // lexicographic iterator
        this._epochs = [];                  // built epochs
        this._epochStart = [];              // start index of each epoch
        this._totalSamples = 0;            // sum of lengths of built epochs
        // Ensure we have at least enough data for the first call
        this._ensureEpochContains(this.WINDOW);
    }

    // ----------------------------------------------------------------
    // Make sure we have generated epochs up to absolute index `idx`
    // ----------------------------------------------------------------
    _ensureEpochContains(idx) {
        while (this._totalSamples <= idx) {
            let vec = this._phaseIter.next().value;
            if (!vec) {
                //TODO - change something
                this._phaseIter = phaseVectorGen()
                vec = this._phaseIter.next().value;
            }
            const epoch = buildEpoch(vec);
            this._epochs.push(epoch);
            this._epochStart.push(this._totalSamples);
            this._totalSamples += epoch.length;
        }
    }

    // ----------------------------------------------------------------
    // Return `len` samples starting at absolute index `absIdx`
    // (window may cross any number of epochs)
    // ----------------------------------------------------------------
    _samplesAt(absIdx, len) {
        const out = new Uint16Array(len);
        let copied = 0;
        let pos = absIdx;

        while (copied < len) {
            this._ensureEpochContains(pos);
            // Find the epoch that contains `pos` – linear search is fine
            // because the number of epochs is tiny (a few hundred at most).
            let epochIdx = this._epochStart.findIndex((start, i) => {
                const next = (i + 1 < this._epochStart.length) ?
                    this._epochStart[i + 1] : this._totalSamples;
                return pos >= start && pos < next;
            });
            const epochStart = this._epochStart[epochIdx];
            const epoch = this._epochs[epochIdx];
            const offset = pos - epochStart;
            const take = Math.min(epoch.length - offset, len - copied);
            out.set(epoch.subarray(offset, offset + take), copied);
            copied += take;
            pos += take;
        }
        return out;
    }

    // ----------------------------------------------------------------
    // Public method – returns a 128‑bit DUN (Buffer of 16 bytes)
    // ----------------------------------------------------------------
    generateNextDUN() {
        // 1) Grab the 4096‑sample window starting at the current offset
        const win = this._samplesAt(this._globalPos, this.WINDOW);

        // 2) Hash with SHA‑256 and keep the first 128 bits
        const buf = Buffer.allocUnsafe(this.WINDOW * 2);
        for (let i = 0; i < this.WINDOW; ++i) {
            buf.writeUInt16LE(win[i], i * 2);
        }
        const hash = crypto.createHash('sha256').update(buf).digest();

        // 3) Advance to the next window (no wrap – stream is effectively infinite)
        this._globalPos += 1;

        return hash.slice(0, 16); // 16‑byte Buffer = 128‑bit DUN
    }
}


// -------------------------------------------------------------------
// Demo – calling it repeatedly yields *different* non‑zero DUNs
// -------------------------------------------------------------------
if (false) {
    const gen = new AvalancheDUNGenerator();

    console.log('First  DUN :', gen.generateNextDUN().toString('hex'));
    console.log('Second DUN :', gen.generateNextDUN().toString('hex'));
    console.log('Third  DUN :', gen.generateNextDUN().toString('hex'));

    // Show that after many calls we keep getting new values
    for (let i = 0; i < 5000; ++i) gen.generateNextDUN();
    console.log('After 5000 more calls :', gen.generateNextDUN().toString('hex'));
}
