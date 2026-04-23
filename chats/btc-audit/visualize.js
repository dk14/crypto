// ---------------------------------------------------------------
// visualise.js – demo that draws the generated waveform
// ---------------------------------------------------------------

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const {
  getADCMeasurement,
  resetTRNG,
  ADC_BITS,
  SAMPLE_RATE,
} = require('./thermal.js');

/********************************************************************
 * thermal‑noise‑TRNG visualiser – creates a self‑contained HTML file *
 ********************************************************************/

// ---------------------------------------------------------------
// 1️⃣  Bring the generator into this script
// ---------------------------------------------------------------
// Option A – copy‑paste the generator code right here (the whole
//   getADCMeasurement / resetTRNG implementation from the previous
//   answer).  For brevity the script assumes the generator lives in a
//   separate file named `thermal-noise-trng.js`:
//
// const { getADCMeasurement, resetTRNG } = require('./thermal-noise-trng');

// Option B – if you already have the generator in this same file, just
// comment out the `require` line and make sure the functions are defined
// above this section.

// ---------------------------------------------------------------
// 2️⃣  Configuration – change these to affect the output size
// ---------------------------------------------------------------
const SAMPLE_COUNT = 2048 * 20000;            // how many ADC words we will plot
const SAMPLE_START = SAMPLE_COUNT - 2048 * 20; 
const HTML_FILE    = 'noise.html';    // file that will be written

// ---------------------------------------------------------------
// 3️⃣  Grab the samples
// ---------------------------------------------------------------
resetTRNG();                         // start from the first spectrum
const samples = new Uint16Array(SAMPLE_COUNT);
for (let i = 0; i < SAMPLE_COUNT; ++i) {
  const w = getADCMeasurement();
  if (w === undefined) {            // all spectra exhausted – stop early
    samples = samples.subarray(0, i);
    break;
  }
  samples[i] = w;
}

// ---------------------------------------------------------------
// 4️⃣  Build the HTML string
// ---------------------------------------------------------------
function buildHTML(dataArray) {
  const maxVal = (1 << 12) - 1;            // 12‑bit ADC → 4095
  const width  = dataArray.length;        // one pixel per sample (you can upscale)
  const height = 300;                     // canvas height in px

  // Convert the Uint16Array into a JavaScript literal – this is safe because
  // the array length is modest (a few thousand entries).
  const jsArray = '[' + Array.from(dataArray).join(',') + ']';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Thermal‑noise TRNG waveform</title>
  <style>
    body { font-family: sans-serif; margin: 1em; }
    canvas { border:1px solid #aaa; }
  </style>
</head>
<body>
  <h2>TRNG waveform (12‑bit ADC, ${dataArray.length} samples)</h2>
  <canvas id="sig" width="${width}" height="${height}"></canvas>
${dataArray.length}
  <script>
    const data = ${jsArray};
    const canvas = document.getElementById('sig');
    const ctx = canvas.getContext('2d');

    const w    = canvas.width;
    const h    = canvas.height;
    const maxV = ${maxVal};

    // clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,w,h);

    // draw axis (optional)
    ctx.strokeStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(0, h/2);
    ctx.lineTo(w, h/2);
    ctx.stroke();

    // draw the waveform
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < data.length; ++i) {
      const x = i;                                     // one pixel per sample
      const y = h - (data[i] / maxV) * h;               // invert y‑axis
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------
// 5️⃣  Write the HTML file
// ---------------------------------------------------------------
const fs = require('fs');
fs.writeFileSync(HTML_FILE, buildHTML(samples.slice(SAMPLE_START)));
console.log(`✅  ${HTML_FILE} written – open it in a browser to see the waveform.`);
