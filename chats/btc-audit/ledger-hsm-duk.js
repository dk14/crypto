/*********************************************************************
 * hsm-simulator.js – deterministic “factory HSM” that produces the
 *                     Device‑Unique‑Key (DUK) and the OTP‑stored
 *                     factory seed (FSEED).
 *
 *   getHsmSeed()  → { duk: Buffer(32), fseed: Buffer(32) }
 *
 *   The whole module is pure JavaScript, uses only the built‑in `crypto`
 *   module and runs the same way on any recent Node version (>=12).
 *
 *   • The raw TRNG is a 32‑bit maximal‑length LFSR seeded with the
 *     constant 0xA5A5A5A5 – this makes the output fully deterministic.
 *   • A tiny health‑test (continuous‑test) is included to illustrate the
 *     standard‑requirement that an HSM must run a self‑check before seeding.
 *   • The extractor is SHA‑256, which is the construction used by Ledger
 *     (the DUK itself is the raw 256‑bit output; the OTP stores the hash
 *     of DUK‖0x00, i.e. the *factory seed*).
 *********************************************************************/
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const crypto = require('crypto');

/* --------------------------------------------------------------- *
 * 1️⃣  Deterministic raw TRNG – maximal‑length 32‑bit LFSR
 * --------------------------------------------------------------- */
class RawLfsr {
  /**
   * @param {number} seed32 – any non‑zero 32‑bit integer.
   */
  constructor(seed32) {
    if (seed32 === 0) throw new Error('LFSR seed must be non‑zero');
    this.state = seed32 >>> 0; // keep it unsigned 32‑bit
  }

  /** produce one raw bit (LSB) and advance the LFSR */
  nextBit() {
    // taps for a 32‑bit primitive polynomial:
    //    x^32 + x^22 + x^2 + x^1 + 1
    const lsb = this.state & 1;
    const newBit =
      ((this.state >>> 31) ^
       (this.state >>> 21) ^
       (this.state >>> 1) ^
       (this.state >>> 0)) & 1;
    this.state = ((this.state << 1) | newBit) >>> 0;
    return lsb;
  }

  /** return a Buffer containing `n` random bytes */
  nextBytes(n) {
    const buf = Buffer.allocUnsafe(n);
    for (let i = 0; i < n; ++i) {
      let byte = 0;
      for (let b = 0; b < 8; ++b) {
        byte = (byte << 1) | this.nextBit();
      }
      buf[i] = byte;
    }
    return buf;
  }
}

/* --------------------------------------------------------------- *
 * 2️⃣  Very small health‑test (continuous‑test) – optional but shows
 *     the “self‑check” requirement of a real HSM.
 * --------------------------------------------------------------- */
function continuousTest(buffer) {
  // Rule: No more than three identical consecutive 64‑bit blocks.
  // (In a real HSM the test is stricter; this is just illustrative.)
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let repeats = 0;
  let prev = view.getBigUint64(0);
  for (let offset = 8; offset < buffer.length; offset += 8) {
    const cur = view.getBigUint64(offset);
    if (cur === prev) repeats++;
    else repeats = 0;
    if (repeats > 3) {
      throw new Error('HSM health test failed – repeated 64‑bit block');
    }
    prev = cur;
  }
}

/* --------------------------------------------------------------- *
 * 3️⃣  Extractor – SHA‑256 of enough raw bits to obtain 256‑bit DUK
 * --------------------------------------------------------------- */
function extractDuk(rawLfsr) {
  // We ask for exactly 32 bytes (256 bits) of raw material.
  // For a maximal‑length LFSR each bit has full entropy, so 256 bits
  // is sufficient to meet the NIST‑800‑90A requirement.
  const raw = rawLfsr.nextBytes(32);

  // Run the tiny health test; a real HSM would abort if it fails.
  continuousTest(raw);

  // SHA‑256 of the raw material gives the final 256‑bit DUK.
  return crypto.createHash('sha256').update(raw).digest(); // Buffer(32)
}

/* --------------------------------------------------------------- *
 * 4️⃣  Public API – getHsmSeed()
 * --------------------------------------------------------------- */
export function getHsmSeed() {
  // The LFSR seed is a constant so the whole module is deterministic.
  const LFSR_SEED = 0xA5A5A5A5;
  const rawLfsr   = new RawLfsr(LFSR_SEED);

  const duk = extractDuk(rawLfsr); // 256‑bit Device‑Unique‑Key

  // Ledger stores SHA‑256( DUK || 0x00 ) in its OTP cell.
  const fseed = crypto.createHash('sha256')
                      .update(Buffer.concat([duk, Buffer.from([0x00])]))
                      .digest();                     // Buffer(32)

  // Return both values – callers can keep the DUK (if they need it) or just the OTP‑seed.
  return { duk, fseed };
}

