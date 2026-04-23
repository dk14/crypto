// ledger-adc-wrapper.js
/*********************************************************************
 * Deterministic Ledger‑style ADC wrapper
 *
 *  * The low‑level source is `getADCMeasurement()` – one 12‑bit word
 *    per call, no waiting.
 *  * The hardware ADC is clocked at `ADC_SAMPLE_RATE` (samples per second).
 *  * Ledger reads the ADC at a lower *read‑out* rate (`READ_RATE_HZ`).
 *    The wrapper therefore **skips** a deterministic number of samples
 *    between two calls.
 *  * A simple deterministic jitter model (`jitter(n)`) can perturb the
 *    skip count in a repeatable way.
 *
 *  Usage:
 *      const { getAdcReading, setReadRate, setJitter } = require('./ledger-adc-wrapper');
 *
 *      // optional – change the read‑out rate (default = 2 kHz)
 *      setReadRate(2000);
 *
 *      // optional – install a custom deterministic jitter function
 *      // (by default jitter(n) always returns 0 → perfectly constant interval)
 *      setJitter(i => (i % 7 === 0 ? 1 : 0));   // example pattern
 *
 *      // read a few samples
 *      (async () => {
 *          for (let i = 0; i < 10; ++i) {
 *              const v = await getAdcReading();   // resolves immediately
 *              console.log(v);
 *          }
 *      })();
 *********************************************************************/

const {
  getADCMeasurement,   // ← deterministic source you already have
  resetTRNG,
} = require('./thermal');   // adjust path if necessary

/* -------------------------------------------------------------
 * 1️⃣  ADC & read‑out rates (constants that match Ledger)
 * ------------------------------------------------------------- */
// Hardware sampling clock (samples per second) – this is *fixed* on the chip.
const ADC_SAMPLE_RATE = 400_000;   // example: 400 kHz – replace with your real value

// Desired logical read‑out frequency (how often the firmware asks the ADC)
// Ledger typically reads a few‑kHz (e.g. 2 kHz).  Change if you know a different value.
let READ_RATE_HZ = 2_000;

/* -------------------------------------------------------------
 * 2️⃣  Derived values – how many hardware samples we have to skip
 * ------------------------------------------------------------- */
// Ideal (float) number of hardware samples per logical read
let idealSkip = ADC_SAMPLE_RATE / READ_RATE_HZ;   // e.g. 400 000/2 000 = 200

// We keep an accumulator that carries the fractional part so that the
// average interval is exactly `idealSkip` over the long run.
let skipAccumulator = 0;

/* -------------------------------------------------------------
 * 3️⃣  Deterministic jitter model (can be swapped out)
 * ------------------------------------------------------------- */
// By default there is **no** jitter – every interval is exactly the same.
let jitterFn = (_callIndex) => 0;

/**
 * Replace the jitter function with a user‑supplied deterministic one.
 * The function receives the call index (0,1,2,…) and must return
 * an integer that will be added to the *skip count*.
 *
 * @param {(i:number)=>number} fn
 */
function setJitter(fn) {
  jitterFn = fn;
}

/* -------------------------------------------------------------
 * 4️⃣  Helper – compute how many hardware samples to skip now
 * ------------------------------------------------------------- */
let callIdx = 0;   // counts how many times getAdcReading() has been invoked

function computeSkip() {
  // Start with the integer part of the ideal interval.
  let skip = Math.floor(idealSkip);

  // Add the accumulated fractional remainder.
  skipAccumulator += idealSkip - skip;
  if (skipAccumulator >= 1) {
    skip += 1;
    skipAccumulator -= 1;
  }

  // Apply deterministic jitter (must stay >=0).
  const jitter = jitterFn(callIdx);
  if (jitter < 0) throw new Error('jitter must be non‑negative');
  skip += jitter;

  callIdx++;
  return skip;
}

/* -------------------------------------------------------------
 * 5️⃣  Core API – deterministic, immediate “read”
 * ------------------------------------------------------------- */
async function getAdcReading() {
  // 1️⃣  Skip the required number of raw samples.
  const toSkip = computeSkip();

  // The underlying source returns undefined when it runs out of entropy.
  for (let i = 0; i < toSkip; ++i) {
    const w = getADCMeasurement();
    if (w === undefined) {
      // exhausted – propagate the same result to the caller.
      return undefined;
    }
    // The loop discards the intermediate values – they are just “sampled”.
  }

  // 2️⃣  The next call to the source gives the value that the firmware
  //     would see on the ADC data register.
  const result = getADCMeasurement();
  return result;   // may be undefined if the source finally ran out
}

/* -------------------------------------------------------------
 * 6️⃣  Public helpers – change the logical read‑out rate
 * ------------------------------------------------------------- */
function setReadRate(hz) {
  if (hz <= 0) throw new Error('read rate must be >0');
  READ_RATE_HZ = hz;
  idealSkip = ADC_SAMPLE_RATE / READ_RATE_HZ;
  // Reset the accumulator so the new rate starts cleanly.
  skipAccumulator = 0;
}

/* -------------------------------------------------------------
 * 7️⃣  Reset the whole deterministic chain (useful for tests)
 * ------------------------------------------------------------- */
function reset() {
  resetTRNG();         // underlying noise source
  callIdx = 0;
  skipAccumulator = 0;
}

/* -------------------------------------------------------------
 * Export
 * ------------------------------------------------------------- */
module.exports = {
  getAdcReading,   // async – returns a 12‑bit word or undefined
  setReadRate,      // change the logical read‑out frequency
  setJitter,        // install a deterministic jitter model
  reset,            // restart from the beginning of the noise source
};
