// avalanche-analog.js
// ---------------------------------------------------------------
// Deterministic avalanche noise generator using only Math.sin / Math.cos.
// No external dependencies.
// ---------------------------------------------------------------
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export class AvalancheAnalog {
  constructor({
    seed = 0,
    frequency = 1e6,
    sampleRate = 128e6,
    gain = 8,
    maskBits = 24,
  } = {}) {
    if (seed >>> 0 !== seed) throw new Error('seed must be a 32â€‘bit unsigned integer');
    if (maskBits < 1 || maskBits > 32) throw new Error('maskBits must be between 1 and 32');

    this.sampleRate = sampleRate;
    this.gain = gain;
    this.mask = (1 << maskBits) - 1;
    this.period = 1 << maskBits;         

    const phaseStepFloat = frequency / sampleRate * 0x1_0000_0000
    this.phaseStep = Math.round(phaseStepFloat) >>> 0; 
    // Force it to be odd so the sequence cycles through the whole mask space.
    this.phaseStep |= 1;

    // ---- initialise accumulator with given seed -------------------------
    // Seed = raw phase value (0 â€¦ 0xffffffff). Using seed 0 is fine;
    // the lowâ€‘order mask bits will still drive the sequence.
    this.phase = seed >>> 0;
    this.samplesGenerated = 0;
  }


  next() {

    this.phase = (this.phase + this.phaseStep) >>> 0;

    const masked = this.phase & this.mask;
    const angle = (masked / (this.mask + 1)) * (2 * Math.PI);

    let v = Math.sin(angle);            // you can swap to Math.cos if you prefer

    v *= this.gain;                     // push the amplitude beyond the limits
    while ((v > 1 || v < -1) && v !== 0 && v != Infinity && v != -Infinity) {
      // Folding rule: reflect about the Â±1 boundaries.
      // Equivalent to: v = 2 * Math.abs(v) - 1  with sign preserved.
      const sign = v < 0 ? -1 : 1;
      v = sign * (2 * Math.abs(v) - 1);
      //console.log("v=" + v)
      if (v == Infinity || v == -Infinity) {
        v = 0
      }
    }

    const adcVal = Math.round(((v + 1) / 2) * 4095) & 0xFFF; // mask to 12 bits


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
   noise is broken
   ------------------------------------------------------------------ */
if (true) {
  const SAMPLE_RATE = 128e6;      // 128 MHz
  const DURATION_US = 10;         // 10 µs demo window
  const total = Math.floor(SAMPLE_RATE * DURATION_US * 1e-6); // 1280 samples
  console.log("total =" + total)

  // Parameters tuned for an audible avalanche-like texture:
  const gen = new AvalancheAnalog({
    seed: 0,               // required by the prompt
    frequency: 2e6,       // 2â€¯MHz base sinusoid (fast enough to create many folds)
    gain: 12,             // stronger folding and more abrupt jumps
    maskBits: 12,         // 4095â€‘sample repeat cycle (fits power ADC buffer)
    sampleRate: SAMPLE_RATE,
  });

  const out = [];
  for (let i = 0; i < total; i++) {
    console.log((gen.next().toString(16).padStart(3, '0')))
    out.push(gen.next().toString(16).padStart(3, '0'));
  }
  console.log(out.join(','));
}

