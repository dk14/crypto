/**
 *  libbitcoin‑explorer (pre‑3.8.0) “seed” emulation
 *  -------------------------------------------------
 *  • Uses the system timer (Date.now()) as the only entropy source.
 *  • Feeds the value to a 32‑bit Mersenne‑Twister (mt19937).
 *  • Extracts a user‑defined number of bits (default 192 = 24 bytes).
 *
 *  The code mirrors the original C++ implementation:
 *      https://github.com/libbitcoin/libbitcoin-explorer/blob/v3.7.0/src/commands/seed.cpp
 *
 *  WARNING: This is *cryptographically weak* and must not be used for
 *  real wallet generation.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const crypto = require('crypto');        // only for converting to Buffer
const MT19937 = require('mersenne-twister'); // npm i mersenne-twister




var i = 1543200000000
/**
 * Generate a seed.
 *
 * @param {number} bitLength – Must be a multiple of 8 and >=128.
 *                           Default = 192 (the historic default).
 * @returns {string} Hex‑encoded seed (lower‑case, no 0x prefix).
 */
export function generateClockSeed(bitLength = 192) {
  if (bitLength % 8 !== 0) {
    throw new Error('bitLength must be a multiple of 8');
  }
  if (bitLength < 128) {
    throw new Error('bitLength must be at least 128 bits');
  }
i += 1000
  // -----------------------------------------------------------------
  // 1) Get the timer – libbitcoin‑explorer used the current time
  //    in *seconds* since the epoch (cast to uint32).  Node’s Date.now()
  //    returns milliseconds, so we divide by 1000 and truncate.
  // -----------------------------------------------------------------
  const nowSec = Math.floor(i / 1000) >>> 0;   // uint32

  // -----------------------------------------------------------------
  // 2) Initialise the 32‑bit Mersenne‑Twister with that seed.
  // -----------------------------------------------------------------
  const rng = new MT19937(nowSec);

  // -----------------------------------------------------------------
  // 3) Pull the required number of bytes.
  //    Each mt19937() call returns a 32‑bit unsigned integer.
  // -----------------------------------------------------------------
  const byteCount = bitLength / 8;
  const out = Buffer.allocUnsafe(byteCount);
  let offset = 0;

  while (offset < byteCount) {
    // Generate a 32‑bit word and write it little‑endian (same as C++).
    const word = rng.random_int();            // 0 … 2³²‑1
    // Write up to 4 bytes (may be less on the final iteration)
    const remaining = Math.min(4, byteCount - offset);
    for (let i = 0; i < remaining; ++i) {
      out[offset + i] = (word >>> (8 * i)) & 0xff;
    }
    offset += remaining;
  }

  // Return hex string exactly like the original CLI (`bx seed -b 256`).
  return out;
}

// ---------------------------------------------------------------------
// Example usage (default 192‑bit seed)
// ---------------------------------------------------------------------
console.log('seed (192‑bit) :', generateClockSeed().toString('hex'));

// Custom bit length – the old tool allowed any >=128 and divisible by 8.
console.log('seed (256‑bit) :', generateClockSeed(256).toString('hex'));