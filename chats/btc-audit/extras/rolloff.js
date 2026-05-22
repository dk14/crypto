 ------------------------------------------------------------
// Node.js script: apply an analog‑front‑end roll‑off to a
// white‑noise spectrum (freqs, amps, phases).
// ------------------------------------------------------------

/**
 * Apply a first‑order low‑pass roll‑off to a magnitude spectrum.
 *
 * @param {Float64Array|number[]} freqs   – frequency bins [Hz]
 * @param {Float64Array|number[]} amps    – linear amplitudes (RMS or peak)
 * @param {Float64Array|number[]} phases  – phase for each bin [rad]
 * @param {Object} options                – optional parameters
 *   @property {number} sampleRate       – ADC sampling rate (Hz), default 44000
 *   @property {number} bits             – ADC resolution (bits), default 12
 *   @property {number} fcRatio          – corner frequency as a fraction of Nyquist,
 *                                         default 0.8 (i.e. 0.8·Nyquist)
 * @returns {{freqs, amps, phases}}      – new objects with rolled‑off amplitudes
 */
function applyRollOff(freqs, amps, phases, options = {}) {
  const sampleRate = options.sampleRate ?? 44_000;   // Hz
  const bits       = options.bits       ?? 12;       // bits (not used for roll‑off)
  const fcRatio    = options.fcRatio    ?? 0.8;       // Nyquist fraction

  const nyquist = sampleRate / 2;                    // 22 kHz
  const fc      = nyquist * fcRatio;                // corner frequency

  // Allocate output arrays (keep original freq / phase unchanged)
  const rolledAmps = new Float64Array(amps.length);

  for (let i = 0; i < freqs.length; i++) {
    const f = Math.abs(freqs[i]);                    // magnitude of frequency
    // First‑order low‑pass magnitude response
    const gain = 1 / Math.sqrt(1 + Math.pow(f / fc, 2));
    rolledAmps[i] = amps[i] * gain;                 // apply roll‑off
  }

  return {
    freqs: Float64Array.from(freqs),   // copy so caller can modify safely
    amps : rolledAmps,
    phases: Float64Array.from(phases)
  };
}

// -----------------------------------------------------------------
// Example usage – generate a white‑noise spectrum and roll it off
// -----------------------------------------------------------------
if (require.main === module) {
  // 1. Build a simple white‑noise spectrum (e.g. 0 … Nyquist, 1 Hz step)
  const sampleRate = 44_000;
  const nyquist    = sampleRate / 2;
  const df         = 1;                 // 1‑Hz frequency resolution
  const N          = Math.floor(nyquist / df) + 1;

  const freqs   = new Float64Array(N);
  const amps    = new Float64Array(N);
  const phases  = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    const f = i * df;
    freqs[i]  = f;
    // White‑noise amplitude: give every bin the same power.
    // Using RMS amplitude of 1 for simplicity.
    amps[i]   = 1.0;
    // Random phase uniformly distributed in [0, 2π)
    phases[i] = Math.random() * 2 * Math.PI;
  }

  // 2. Apply the roll‑off (corner at 0.8·Nyquist ≈ 17.6 kHz)
  const rolled = applyRollOff(freqs, amps, phases, {
    sampleRate: sampleRate,
    bits: 12,
    fcRatio: 0.8
  });

  // 3. Print a few sample points to see the effect
  console.log('   f (Hz)   |   Amp (white)   |   Amp (rolled)');
  console.log('----------------------------------------------');
  for (let i = 0; i < N; i += Math.floor(N / 10)) { // 10 points spread out
    console.log(
      `${freqs[i].toString().padStart(9)} |` +
      ` ${amps[i].toFixed(3).padStart(15)} |` +
      ` ${rolled.amps[i].toFixed(3).padStart(13)}`
    );
  }

  // (Optional) write the whole result to a JSON file for later plotting
  // const fs = require('fs');
  // fs.writeFileSync('rolledSpectrum.json',
  //   JSON.stringify({freqs: Array.from(rolled.freqs),
  //                  amps:  Array.from(rolled.amps),
  //                  phases:Array.from(rolled.phases)}));
}