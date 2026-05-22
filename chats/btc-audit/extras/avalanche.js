// avalanche-analog.js
// ---------------------------------------------------------------
// Deterministic avalancheâ€‘noise generator using only Math.sin / Math.cos.
// No external dependencies.
// ---------------------------------------------------------------

class AvalancheAnalog {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.seed=0]          32â€‘bit integer seed (0 â€¦ 0xffffffff).
   * @param {number} [opts.frequency=1e6]  Desired analogâ€‘frequency in Hz.
   *                                        (Controls phaseâ€‘step size.)
   * @param {number} [opts.sampleRate=128e6]  Samples per second (fixed to 128â€¯MHz).
   * @param {number} [opts.gain=8]          Multiplicative gain before folding.
   * @param {number} [opts.maskBits=24]     Number of lowâ€‘order bits to keep.
   *                                        Determines the repetition period:
   *                                        period = 2^maskBits samples.
   *                                        Use 12 for a 4095â€‘sample cycle,
   *                                        24 for ~16â€¯M samples, etc.
   */
  constructor({
    seed = 0,
    frequency = 1e6,
    sampleRate = 128e6,
    gain = 8,
    maskBits = 24,
  } = {}) {
    // ---- sanity checks -------------------------------------------------
    if (seed >>> 0 !== seed) throw new Error('seed must be a 32â€‘bit unsigned integer');
    if (maskBits < 1 || maskBits > 32) throw new Error('maskBits must be between 1 and 32');

    this.sampleRate = sampleRate;
    this.gain = gain;
    this.mask = (1 << maskBits) - 1;       // keep only the low maskBits bits
    this.period = 1 << maskBits;          // repetition length in samples

    // ---- phase accumulator ---------------------------------------------
    // Phase is represented as a 32â€‘bit fixedâ€‘point fraction of 2Ï€.
    // phaseStep = frequency / sampleRate * 2^32   (rounded to integer).
    const phaseStepFloat = frequency / sampleRate * 0x1_0000_0000; // 2^32
    this.phaseStep = Math.round(phaseStepFloat) >>> 0; // 32â€‘bit unsigned
    // Force it to be odd so the sequence cycles through the whole mask space.
    this.phaseStep |= 1;

    // ---- initialise accumulator with given seed -------------------------
    // Seed = raw phase value (0 â€¦ 0xffffffff). Using seed 0 is fine;
    // the lowâ€‘order mask bits will still drive the sequence.
    this.phase = seed >>> 0;
    this.samplesGenerated = 0;
  }

  /**
   * Produce the next 12â€‘bit sample (integer 0 â€¦ 4095).
   * The method is *lazy* â€“ it computes only one value per call.
   * @returns {number}
   */
  next() {
    // 1ï¸âƒ£ Advance phase (mod 2^32 automatically via Uint32 overflow)
    this.phase = (this.phase + this.phaseStep) >>> 0;

    // 2ï¸âƒ£ Convert lowâ€‘order bits to an angle in radians.
    //   angle = (phase & mask) / 2^maskBits * 2Ï€
    const masked = this.phase & this.mask;
    const angle = (masked / (this.mask + 1)) * (2 * Math.PI);

    // 3ï¸âƒ£ Raw sinusoid (range â€‘1 â€¦ +1)
    let v = Math.sin(angle);            // you can swap to Math.cos if you prefer

    // 4ï¸âƒ£ Apply gain and fold repeatedly until the value lies in [â€‘1,â€¯+1].
    v *= this.gain;                     // push the amplitude beyond the limits
    while (v > 1 || v < -1) {
      // Folding rule: reflect about the Â±1 boundaries.
      // Equivalent to: v = 2 * Math.abs(v) - 1  with sign preserved.
      const sign = v < 0 ? -1 : 1;
      v = sign * (2 * Math.abs(v) - 1);
    }

    // 5ï¸âƒ£ Scale to unsigned 12â€‘bit integer (0 â€¦ 4095)
    const adcVal = Math.round(((v + 1) / 2) * 4095) & 0xFFF; // mask to 12 bits

    // 6ï¸âƒ£ Track period completion (optional flag)
    this.samplesGenerated++;
    this.done = this.samplesGenerated % this.period === 0; // true exactly on wrap

    return adcVal;
  }

  /** Reset the generator to a new seed (useful for testing). */
  reset(seed = 0) {
    this.phase = seed >>> 0;
    this.samplesGenerated = 0;
    this.done = false;
  }
}

/* ------------------------------------------------------------------
   Example usage â€“ generate a short burst (e.g. 10â€¯Âµs) and print as CSV
   ------------------------------------------------------------------ */
if (require.main === module) {
  const SAMPLE_RATE = 128e6;      // 128â€¯MHz
  const DURATION_US = 10;         // 10â€¯Âµs demo window
  const total = Math.floor(SAMPLE_RATE * DURATION_US * 1e-6); // â‰ˆ1280 samples

  // Parameters tuned for an audibleâ€‘like avalanche texture:
  const gen = new AvalancheAnalog({
    seed: 0,               // required by the prompt
    frequency: 2e6,       // 2â€¯MHz base sinusoid (fast enough to create many folds)
    gain: 12,             // stronger folding â†’ more abrupt jumps
    maskBits: 12,         // 4095â€‘sample repeat cycle (fits lowâ€‘power ADC buffer)
    sampleRate: SAMPLE_RATE,
  });

  const out = [];
  for (let i = 0; i < total; i++) out.push(gen.next().toString(16).padStart(3, '0'));
  console.log(out.join(','));
}

/* Export for library use */
module.exports = AvalancheAnalog;