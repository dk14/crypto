// ledger-trng-deterministic.js
// ---------------------------------------------------------------
// Run with: node ledger-trng-deterministic.js
// ---------------------------------------------------------------

const crypto = require('crypto');
const TWO_PI = Math.PI * 2;

// ---------- 1. TUNABLE PARAMETERS ----------
const RO_A_BASE_PERIOD_PS = 5_000;   // 200 MHz nominal (5 ns)
const RO_B_BASE_PERIOD_PS = 5_100;   // Slightly different to avoid lock‑up
const JITTER_STD_PS       = 30;      // Nominal jitter std‑dev (ps)
const NUM_TONES           = 12;      // How many sinusoids we sum
const BASE_TONE_FREQ_HZ   = 1e3;     // 1 kHz lowest tone
const TONE_MULTIPLIER     = 2;      // Geometric progression factor
const ADC_BITS            = 8;      // 8‑bit ADC in the Secure Element
const COUNTER_BITS        = 24;     // Width of the hardware counter
const NUM_SAMPLES         = 200_000; // Number of jitter words to generate

// ---------- 2. Build deterministic “thermal noise” ----------
function buildToneTable() {
  const tones = [];
  for (let i = 0; i < NUM_TONES; i++) {
    const f   = BASE_TONE_FREQ_HZ * Math.pow(TONE_MULTIPLIER, i);
    const amp = 1 / Math.sqrt(f);          // 1/√f roll‑off (approx. thermal PSD)
    const phase = (i * Math.PI) / 7;       // deterministic phase offset
    tones.push({ f, amp, phase });
  }
  return tones;
}
const TONE_TABLE = buildToneTable();

/**
 * Deterministic noise voltage in the range [-1, +1] at time t (seconds).
 */
function noiseVoltage(t) {
  let v = 0;
  for (const { f, amp, phase } of TONE_TABLE) {
    v += amp * Math.sin(TWO_PI * f * t + phase);
  }
  return v;
}

// ---------- 3. Ring‑oscillator period (ps) ----------
/**
 * Returns the period of a ring oscillator at sample index n.
 * The jitter is taken from the deterministic noise voltage and
 * scaled to the desired standard deviation.
 */
function roPeriod(basePeriodPs, n) {
  // Use a slow time base (1 µs per sample) so the noise evolves smoothly.
  const tSec = n * 1e-6;
  const v    = noiseVoltage(tSec);          // -1 … +1
  const jitterPs = v * JITTER_STD_PS;       // scale to desired σ
  return basePeriodPs + jitterPs;
}

// ---------- 4. Pre‑compute periods for speed ----------
const roAPeriod = new Float64Array(NUM_SAMPLES);
const roBPeriod = new Float64Array(NUM_SAMPLES);
for (let i = 0; i < NUM_SAMPLES; i++) {
  roAPeriod[i] = roPeriod(RO_A_BASE_PERIOD_PS, i);
  roBPeriod[i] = roPeriod(RO_B_BASE_PERIOD_PS, i);
}

// ---------- 5. Phase‑difference measurement (raw counter) ----------
/**
 * Simulate one measurement cycle:
 *   count how many RO‑B edges occur while waiting for the next RO‑A edge.
 * Returns the counter value wrapped to COUNTER_BITS.
 */
function measureRawCounter(idx) {
  const aPs = roAPeriod[idx];
  const bPs = roBPeriod[idx];
  // Integer division gives the number of B‑ticks in one A‑period.
  const raw = Math.floor(aPs / bPs);
  // Wrap to the hardware counter width.
  return raw & ((1 << COUNTER_BITS) - 1);
}

/**
 * ADC‑style mask – keep only the lowest ADC_BITS bits.
 */
function adcMask(raw) {
  const mask = (1 << ADC_BITS) - 1;
  return raw & mask; // 0 … 255 for an 8‑bit ADC
}

// ---------- 6. Generate the raw byte stream ----------
function generateRawBytes() {
  const buf = Buffer.alloc(NUM_SAMPLES); // one byte per sample
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const raw = measureRawCounter(i);
    const adc = adcMask(raw);
    buf[i] = adc;
  }
  return buf;
}

// ---------- 7. Ledger‑style entropy extractor ----------
/**
 * The official Ledger firmware runs the raw bytes through a SHA‑256
 * based extractor (effectively a KDF).  A single hash is sufficient
 * to illustrate the pipeline.
 */
function extractEntropy(rawBuf) {
  const hash = crypto.createHash('sha256');
  hash.update(rawBuf);
  return hash.digest(); // 32‑byte Buffer
}

// ---------- 8. Run the full pipeline ----------
const rawBytes = generateRawBytes();
const entropy  = extractEntropy(rawBytes);

// ---------- 9. Report ----------
console.log('First 32 entropy bytes (hex):', entropy.toString('hex'));
console.log('Distinct ADC codes observed:', new Set(rawBytes).size);
console.log('Total raw bytes generated:', rawBytes.length);
