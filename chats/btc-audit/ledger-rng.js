/********************************************************************
 * ledger-rng.js
 *
 * Simulates the Ledger Secure Element true‑random number generator.
 *
 * The real device:
 *   – Samples an ADC (12‑bit) at irregular intervals.
 *   – Whitenes the raw values by XOR‑ing successive samples.
 *   – Feeds the result to a SHA‑256‑based “entropy extractor”, which
 *     outputs a cryptographically‑strong 256‑bit buffer.
 *
 * This file reproduces the *algorithmic* part.  The ADC source itself
 * is abstracted by the user‑supplied async getAdcReading() function.
 ********************************************************************/

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import {getHsmSeed} from './ledger-hsm-duk.js'

// ---------------------------------------------------------------
// ledger-rng.js – faithful emulation (DUK + rolling XOR pool)
// ---------------------------------------------------------------
import crypto from 'crypto';

/* ---------- 1️⃣  Device‑Unique‑Key (DUK) ---------- */
const DUK = crypto.randomBytes(16);          // 128‑bit constant for this process

//const DUK = getHsmSeed().duk
/* ---------- 2️⃣  Persistent RNG state ---------- */
let prevSample = Buffer.alloc(2);            // rolling ADC value
let pool = Buffer.alloc(33, 0);               // 33‑byte pool (264 bits)
let poolLen = 0;

/* --------- 3️⃣  Initialize pool with the DUK (runs once) --------- */
(function rngBootInit() {
  for (let i = 0; i < DUK.length; i++) {
    pool[i] ^= DUK[i];
  }
})();


import {getAdcReading} from './ledger-sampler.js'



/* ---------- 4️⃣  Mock ADC (replace with native binding) ---------- */
export async function getAdcReading2() {
  // Real hardware would read the noise pin; here we use crypto‑secure RNG.
  return crypto.randomInt(0, 0x1000);       // 0‑4095 inclusive
}

/* ---------- 5️⃣  Core collection routine ---------- */
export async function collectEntropy() {
  while (poolLen < 33) {
    const raw = await getAdcReading();     // 12‑bit raw ADC
    const cur = Buffer.alloc(2);
    cur[0] = (raw >> 8) & 0xff;
    cur[1] = raw & 0xff;

    // Rolling‑XOR whitening of the ADC sample
    const whitened = Buffer.from([
      cur[0] ^ prevSample[0],
      cur[1] ^ prevSample[1],
    ]);
    prevSample = cur;                       // update persistent state

    // XOR‑mix into the pool at the current offset
    pool[poolLen]     ^= whitened[0];
    pool[poolLen + 1] ^= whitened[1];
    poolLen += 2;
  }

  // SHA‑256 extractor over the whole 33‑byte pool (DUK + all samples)
  const entropy = crypto.createHash('sha256')
                       .update(pool)
                       .digest();               // 32 bytes = 256 bits

  // Reset pointer for the next call – keep the DUK bytes in the pool
  poolLen = 0;
  return entropy;
}

/********************************************************************
 * ledger-seed-gen.js
 *
 * Implements the full Ledger seed generation algorithm:
 *   1. Collect 256 bits of high‑quality entropy (via ledger‑rng.js)
 *   2. Compute SHA‑256 over those bits and take the first 8 bits as checksum
 *   3. Append checksum → 264 bits
 *   4. Split into 24 groups of 11 bits
 *   5. Convert each group to a BIP‑39 English word
 ********************************************************************/

const fs = require('fs');
const path = require('path');

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert a Buffer to a binary string (most‑significant‑bit first).
 * @param {Buffer} buf
 * @returns {string}
 */
function bufferToBits(buf) {
  let bits = '';
  for (const byte of buf) {
    bits += byte.toString(2).padStart(8, '0');
  }
  return bits;
}

/**
 * Turn a binary string (any length) into an integer.
 * @param {string} binStr  e.g. '10101'
 * @returns {number}
 */
function binToInt(binStr) {
  return parseInt(binStr, 2);
}

/**
 * Generate a 24‑word BIP‑39 mnemonic exactly as Ledger does.
 *
 * @param {Function} getAdcReading  async () => number  // ADC mock
 * @returns {Promise<string[]>}   array of 24 words
 */
export async function generateLedgerSeed(mode) {
  const entropy = await collectEntropy(getAdcReading);
  const checksumFull = crypto.createHash('sha256').update(entropy).digest();
  const checksumBits = checksumFull[0].toString(2).padStart(8, '0'); // 8‑bit string 
  return entropy // 256 bits
}

console.log((await generateLedgerSeed()).toString('hex'))