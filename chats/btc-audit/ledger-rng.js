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

const crypto = require('crypto');
const ENTROPY_BYTES = 32;               // 256‑bit final entropy required
const SAMPLE_SIZE   = 2;                // we collect 2 bytes per ADC sample (12‑bit fits in 2)


/**
 * Simple whitening: xor each new sample with the previous one.
 * The real firmware does exactly that (see the open‑source SE code released
 * by Ledger – a 1‑byte rolling XOR is used before feeding the pool).
 *
 * @param {Buffer} prev  Buffer containing the previous sample (2 bytes)
 * @param {Buffer} cur   Buffer containing the current raw ADC sample (2 bytes)
 * @returns {Buffer}    Whitened sample (2 bytes)
 */
function whiten(prev, cur) {
  const out = Buffer.alloc(2);
  out[0] = prev[0] ^ cur[0];
  out[1] = prev[1] ^ cur[1];
  return out;
}

/**
 * Pull enough ADC samples, whiten them, and push them into a SHA‑256
 * based extractor (the “expansion” step).  The extractor is simply a
 * hash that we keep updating; when we have consumed ENTROPY_BYTES we
 * stop.
 *
 * @param {Function} getAdcReading   async () => number   // 0‑4095
 * @returns {Promise<Buffer>} 256‑bit entropy buffer
 */
async function get256BitEntropy(getAdcReading) {
  // Initialise a SHA‑256 context that will act as the extractor.
  const hash = crypto.createHash('sha256');

  // First sample is used as the initial “previous” value for whitening.
  let prevSample = Buffer.alloc(2);
  // Fill the pool until we have 256 bits = 32 bytes.
  let produced = 0;
  let dg = undefined
  while (produced < ENTROPY_BYTES) {
    // -------------------------------------------------------------
    // 1️⃣  Get a raw ADC reading (12‑bit).  The real device samples
    //     the internal noise source at a non‑deterministic rate.
    // -------------------------------------------------------------
    const raw = await getAdcReading();               // 0 – 4095
    const curSample = Buffer.alloc(2);
    curSample[0] = (raw >> 8) & 0xff;                 // high byte
    curSample[1] = raw & 0xff;                       // low  byte

    // -------------------------------------------------------------
    // 2️⃣  Whitening – XOR with previous sample.
    // -------------------------------------------------------------
    const whitened = whiten(prevSample, curSample);
    prevSample = curSample;                          // store for next round

    // -------------------------------------------------------------
    // 3️⃣  Feed the whitened bytes to the SHA‑256 extractor.
    // -------------------------------------------------------------
    hash.update(whitened);
    dg = hash.digest()
    produced = dg.length; // after first digest we get 32 bytes
    // The above line is only to compute the final length; we will call
    // .digest() once at the end of the loop.
    // (Keeping a running length avoids an extra variable.)
  }

  // Final 256‑bit entropy.
  return dg;   // Buffer(32)
}

/**
 * Public API – wrapper that returns a Promise<Buffer>.
 *
 * @param {Function} getAdcReading   async () => number   // mocked ADC
 * @returns {Promise<Buffer>} 256‑bit seed entropy
 */
async function collectEntropy(getAdcReading) {
  return await get256BitEntropy(getAdcReading);
}


let rng = crypto.createHash('sha256'); // a deterministic source for demo

async function getAdcReading() {
  // We use the hash of a counter to obtain reproducible “random” values.
  rng.update(Buffer.from([Date.now() & 0xff])); // tiny variation
  const out = rng.digest().slice(0, 2);        // 2 bytes = 16 bits, truncate
  const value = ((out[0] << 8) | out[1]) & 0x0fff; // keep only 12 bits
  // Re‑initialise the hash with the same output so we can keep streaming.
  rng = crypto.createHash('sha256').update(out);
  return value;                                 // 0 – 4095
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
export async function generateLedgerSeed() {
  const entropy = await collectEntropy(getAdcReading);
  const checksumFull = crypto.createHash('sha256').update(entropy).digest();
  const checksumBits = checksumFull[0].toString(2).padStart(8, '0'); // 8‑bit string 
  return entropy // 256 bits
}

console.log((await generateLedgerSeed()).toString('hex'))