/********************************************************************
 * thermal‑noise‑TRNG (composite‑tone version – fixed period bug)
 *
 *  • Quantises frequency, amplitude and phase to the resolution of a
 *    12‑bit ADC.
 *  • Enumerates *all* possible spectra that consist of up to
 *    MAX_TONES tones.
 *  • For each spectrum it streams ADC words until the **exact discrete
 *    period** of the summed waveform has been emitted, then moves to the
 *    next spectrum.
 *  • When every admissible spectrum has been exhausted the function
 *    returns `undefined` forever.
 *
 *  The module is a single .js file, no external dependencies.
 ********************************************************************/

/* --------------------------------------------------------------- *
 * 1️⃣  ADC / oscillator specifications (tweak to your hardware)   *
 * --------------------------------------------------------------- */
export const ADC_BITS    = 12;                // 12‑bit → 0 … 4095
const ADC_MAX     = (1 << ADC_BITS) - 1;
const ADC_MIN     = 0;
export const SAMPLE_RATE = 48_000;            // samples per second (Hz)

// Discrete steps the ADC can resolve
const FREQ_STEPS  = 64;                // number of distinct frequencies
const PHASE_STEPS = 16;                // number of distinct phase values
const AMP_LEVELS = 1 << ADC_BITS;    // full 12‑bit amplitude resolution

// How many sinusoidal components may be present in one spectrum?
const MAX_TONES   = 2;                // change to 3,4 … if you want more

/* --------------------------------------------------------------- *
 * 2️⃣  Small integer helpers                                         *
 * --------------------------------------------------------------- */
function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
function lcm(a, b) { return (a / gcd(a, b)) * b; }

/* --------------------------------------------------------------- *
 * 3️⃣  Quantised axes (pre‑computed)                                   *
 * --------------------------------------------------------------- */
// Frequency step = Fs / (2 * FREQ_STEPS)  (Nyquist‑limited grid)
const FREQ_STEP_HZ = SAMPLE_RATE / (2 * FREQ_STEPS);
const freqList = [];
for (let i = 0; i < FREQ_STEPS; ++i) freqList.push(i * FREQ_STEP_HZ);

// Phase step = 2π / PHASE_STEPS
const phaseList = [];
for (let i = 0; i < PHASE_STEPS; ++i)
  phaseList.push(i * (2 * Math.PI) / PHASE_STEPS);

// Amplitude step (assume full‑scale 0 … 1 V)
const ampStep = 1 / (AMP_LEVELS - 1);
const ampList = [];
for (let i = 0; i < AMP_LEVELS; ++i) ampList.push(i * ampStep);

/* --------------------------------------------------------------- *
 * 4️⃣  Enumeration state (odometer over tones)                       *
 * --------------------------------------------------------------- */
let toneIndices = [];   // each element: {f, a, p} = indices into the three lists
let toneCount   = 0;    // how many tone slots are currently active (1 … MAX_TONES)

let currentSpec = null; // {tones:[{freq,amp,phase,period}], periodSamples, samplePos}

/* --------------------------------------------------------------- *
 * 5️⃣  Build a spec object from the current odometer position        *
 * --------------------------------------------------------------- */
function buildCurrentSpec() {
  // Translate the index triples into real values and compute each tone's
  // integer period (in samples).  The overall period = LCM of the individual ones.
  const tones = toneIndices.map(idx => {
    const freq   = freqList[idx.f];
    const amp    = ampList[idx.a];
    const phase  = phaseList[idx.p];

    // ----- discrete period of ONE sine ----------------------------
    // freq = k * FREQ_STEP_HZ   with k = integer
    // periodSamples = 2*FREQ_STEPS / gcd(2*FREQ_STEPS , k)
    const k = Math.round(freq / FREQ_STEP_HZ);      // integer multiple
    const base = 2 * FREQ_STEPS;                  // denominator of the grid
    const tonePeriod = (k === 0) ? 1               // DC → period 1 (won't repeat)
                       : base / gcd(base, k);   // integer period in samples

    return { freq, amp, phase, period: tonePeriod };
  });

  const periodSamples = tones.reduce((acc, t) => lcm(acc, t.period), 1);
  return { tones, periodSamples, samplePos: 0 };
}

/* --------------------------------------------------------------- *
 * 6️⃣  Advance the odometer (lexicographic order)                    *
 * --------------------------------------------------------------- */
function advanceCursor() {
  // fast wheel = phase, then amplitude, then frequency, then tone‑slot
  for (let slot = 0; slot < toneCount; ++slot) {
    const idx = toneIndices[slot];
    //console.log(idx)
    idx.p++;
    if (idx.p < PHASE_STEPS) return true;
    idx.p = 0; idx.a++;
    if (idx.a < AMP_LEVELS) return true;
    idx.a = 0; idx.f++;
    if (idx.f < FREQ_STEPS) return true;
    idx.f = 0;                                   // this slot exhausted → carry
  }

  // All existing slots wrapped → add a new tone if we have capacity
  if (toneCount < MAX_TONES) {
    toneIndices.push({ f: 0, a: 0, p: 0 });
    toneCount++;
    return true;
  }

  // No more combinations left.
  return false;
}

/* --------------------------------------------------------------- *
 * 7️⃣  Helper – does a spec contain any non‑zero amplitude?          *
 * --------------------------------------------------------------- */
function hasNonZeroAmplitude(spec) {
  return spec.tones.some(t => t.amp > 0);
}

/* --------------------------------------------------------------- *
 * 8️⃣  Core measurement routine                                      *
 * --------------------------------------------------------------- */
export function getADCMeasurement() {
  // --------------------------------------------------------------
  // 8.1  Have we already walked through all spectra?
  if (!currentSpec && !advanceCursor()) return undefined;

  // --------------------------------------------------------------
  // 8.2  Build a *valid* spec (skip the all‑zero cases)
  while (!currentSpec) {
    const candidate = buildCurrentSpec();
    if (hasNonZeroAmplitude(candidate)) {
      currentSpec = candidate;
      break;
    }
    // all amplitudes zero → move to next combination
    if (!advanceCursor()) return undefined;
  }

  // --------------------------------------------------------------
  // 8.3  Generate ONE 12‑bit ADC word – sum of all tones
  const t = currentSpec.samplePos / SAMPLE_RATE; // time in seconds
  let analog = 0;
  for (const tone of currentSpec.tones) {
    const angle = 2 * Math.PI * tone.freq * t + tone.phase;
    analog += tone.amp * Math.sin(angle);
  }

  // Map analog (‑1 … +1) → unsigned 12‑bit integer
  const scaled = ((analog + 1) / 2) * ADC_MAX;
  const word   = Math.round(scaled);
  const adcWord = Math.max(ADC_MIN, Math.min(ADC_MAX, word));

  //console.log(currentSpec.periodSamples)
  // --------------------------------------------------------------
  // 8.4  Advance sample pointer; when we reach the period we go to the
  //      next spectrum (which will be built on the next loop pass).
  currentSpec.samplePos++;
  if (currentSpec.samplePos >= currentSpec.periodSamples) {
    // Finished this spectrum – try to advance the odometer.
    if (!advanceCursor()) {
      currentSpec = null;                 // will cause `undefined` next call
    } else {
      // Build the next spec on the *next* loop iteration so that we can
      // filter out any “all‑zero” spectrum there.
      currentSpec = null;
    }
  }

  return adcWord;
}

/* --------------------------------------------------------------- *
 * 9️⃣  Reset helper (useful for unit‑tests or repeated runs)        *
 * --------------------------------------------------------------- */
export function resetTRNG() {
  toneIndices = [];
  toneCount   = 0;
  currentSpec = null;
}