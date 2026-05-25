// lazyAvalancheDUN.js
// ------------------------------------------------------------
// Lazy generator for Ledger‑style 128‑bit DUNs.
// ------------------------------------------------------------


import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const crypto = require('crypto');

// -------------------------------------------------------------------
// 1️⃣  Global constants – same ones used before
// -------------------------------------------------------------------
const SAMPLE_RATE   = 2_000_000;   // 2 MHz ADC
const BIT_RES       = 12;
const FS_VOLTAGE    = 3.0;         // V
const LSB           = FS_VOLTAGE / ((1 << BIT_RES) - 1);
const N_TONES       = 4;
const ANALOG_BW     = 800_000;    // Hz
const DF            = Math.floor(ANALOG_BW / N_TONES); // Hz
const AVALANCHE_PSD = 1e-14;      // V²/Hz, replace with calibrated value
const AMPLITUDE     = Math.sqrt(2 * AVALANCHE_PSD * DF);

// -------------------------------------------------------------------
// 2️⃣  Phase quantisation (how many distinct phases the ADC can see)
// -------------------------------------------------------------------
const phaseStepRad  = Math.asin(LSB / AMPLITUDE);
const STEPS_PER_TONE = Math.max(2, Math.round(2 * Math.PI / phaseStepRad));

// -------------------------------------------------------------------
// 3️⃣  Helpers for LCM & enumeration (same as previous module)
// -------------------------------------------------------------------
function lcm(a, b) {
    const g = (x, y) => (!y ? x : g(y, x % y));
    return (a / g(a, b)) * b;
}
function lcmArray(arr) {
    return arr.reduce((acc, v) => lcm(acc, v), 1);
}

// Lexicographic generator of all phase‑vectors (lazy)
function* phaseVectorGen() {
    const max = STEPS_PER_TONE;
    const vec = new Array(N_TONES).fill(0);
    while (true) {
        yield vec.slice();                 // copy
        // increment like an N‑digit counter
        let pos = N_TONES - 1;
        while (pos >= 0) {
            vec[pos] = (vec[pos] + 1) % max;
            if (vec[pos] !== 0) break;
            pos--;
        }
        if (pos < 0) return;               // exhausted
    }
}

// -------------------------------------------------------------------
// 4️⃣  Build ONE epoch for a given phase vector (lazy, cached)
// -------------------------------------------------------------------
function buildEpoch(phaseIdx) {
    const twoPi = 2 * Math.PI;
    const phases = phaseIdx.map(i => (i / STEPS_PER_TONE) * twoPi);

    // Period (in samples) of each tone
    const tonePeriods = [];
    for (let k = 0; k < N_TONES; ++k) {
        const f = (k + 1) * DF;
        tonePeriods.push(Math.round(SAMPLE_RATE / f));
    }
    const epochLen = lcmArray(tonePeriods); // integer LCM

    const epoch = new Uint16Array(epochLen);
    for (let n = 0; n < epochLen; ++n) {
        let v = 0;
        for (let k = 0; k < N_TONES; ++k) {
            const f = (k + 1) * DF;
            v += AMPLITUDE * Math.cos(twoPi * f * n / SAMPLE_RATE + phases[k]);
        }
        // Quantise to ADC code
        let code = Math.round((v / FS_VOLTAGE) * ((1 << BIT_RES) - 1));
        if (code < 0)   code = 0;
        if (code > 0xFFF) code = 0xFFF;
        epoch[n] = code;
    }
    return epoch;
}

// -------------------------------------------------------------------
// 5️⃣  Lazy DUN generator class
// -------------------------------------------------------------------
export class AvalancheDUNGenerator {
    constructor() {
        // Sliding‑window size used by Ledger to derive the DUN
        this.WINDOW = 4096;                // samples (≈2 ms)
        // Internal state
        this._pos = 0;                      // current sample offset
        this._phaseIter = phaseVectorGen(); // iterator over phase vectors
        this._currentEpoch = null;          // Uint16Array for the active epoch
        this._currentLen = 0;               // length of the active epoch
        this._loadNextEpoch();              // initialise first epoch
    }

    // Load the *next* epoch (lazy – called only when we run out of the
    // current one).  The epoch is cached in `this._currentEpoch`.
    _loadNextEpoch() {
        const vec = this._phaseIter.next().value;
        if (!vec) throw new Error('Exhausted all phase vectors – should never happen.');
        this._currentEpoch = buildEpoch(vec);
        this._currentLen   = this._currentEpoch.length;
    }

    // Return a Uint16Array containing `len` samples starting at the
    // current offset, automatically stitching across epoch boundaries.
    _peekSamples(len) {
        const out = new Uint16Array(len);
        let written = 0;
        let pos = this._pos;

        while (written < len) {
            const remainInEpoch = this._currentLen - pos;
            const need = len - written;
            const copyCnt = Math.min(remainInEpoch, need);
            out.set(this._currentEpoch.subarray(pos, pos + copyCnt), written);
            written += copyCnt;
            pos += copyCnt;

            if (pos >= this._currentLen) {
                // We reached the end of the current epoch → move to next
                this._loadNextEpoch();
                pos = 0;
            }
        }
        return out;
    }

    // Public API – returns the next 128‑bit DUN (Buffer of 16 bytes)
    generateNextDUN() {
        // 1) Grab the 4096‑sample window starting at current offset
        const windowSamples = this._peekSamples(this.WINDOW);

        // 2) Hash it with SHA‑256 and keep the first 128 bits
        const buf = Buffer.allocUnsafe(this.WINDOW * 2);
        for (let i = 0; i < this.WINDOW; ++i) {
            buf.writeUInt16LE(windowSamples[i], i * 2);
        }
        const hash = crypto.createHash('sha256').update(buf).digest();

        // 3) Advance the internal offset for the *next* call
        this._pos = (this._pos + this.WINDOW) % this._currentLen;
        // If the offset lands exactly at an epoch boundary we have to
        // load the following epoch now, otherwise the next call would
        // read the tail of the old epoch and the head of the new one.
        if (this._pos === 0) this._loadNextEpoch();

        // 4) Return the 128‑bit DUN
        return hash.slice(0, 16); // Buffer(16)
    }
}

// -------------------------------------------------------------------
// 7️⃣  Demo – call it a few times
// -------------------------------------------------------------------
if (false) {
    const gen = new AvalancheDUNGenerator();
    console.log('First DUN  :', gen.generateNextDUN().toString('hex'));
    console.log('Second DUN :', gen.generateNextDUN().toString('hex'));
    console.log('Third DUN  :', gen.generateNextDUN().toString('hex'));

    // Show that after many calls we eventually cross an epoch boundary
    for (let i = 0; i < 2000; ++i) gen.generateNextDUN(); // burn some
    console.log('DUN after many calls :', gen.generateNextDUN().toString('hex'));
}
