// Bake "dither-ui" wordmark layers from Consolas Bold — a scale-accurate port
// of ghost.ai's engraved footer recipe (their assets in ghostai-ref/, k =
// 236/524.804 = 0.4497 shrinks their filter numbers to this viewBox):
//   rim     = inside-stroke #D6EAFF 0.7 (glyph-masked), whole group blurred
//   letters = glyphs filled #00050A @10% with white under-glows + two black
//             inner shadows from above (their ddii filter)
//   lit     = glyph-bounded grain for the cursor pool (their lit-noise)
// One-off asset generator — output lands in public/.
const opentype = require("opentype.js");
const fs = require("fs");

const buf = fs.readFileSync("C:/Windows/Fonts/consolab.ttf");
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const font = opentype.parse(ab);
const size = 200;
const pad = 24; // bleed room for rim glow so <img> crop never clips it
const text = "dither-ui";
const path = font.getPath(text, pad, size * 0.78, size, { kerning: true });
const d = path.toPathData(3);
const b = path.getBoundingBox();
const W = Math.ceil(b.x2 + pad);
const H = Math.ceil(size * 0.78 + size * 0.28 + pad);

// ghost's numbers at their 524.804-tall box → ours at H
const k = H / 524.804;
const n = (v) => +(v * k).toFixed(3);

// ---- rim: inside stroke, blurred — the glow that hugs every inner edge ----
const RIM_STROKE = n(6.62783); // 2.981
const RIM_BLUR = n(3.31392); // 1.49
const rim = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <mask id="wm-ins" fill="white">
      <path d="${d}"/>
    </mask>
    <filter id="wm-rimblur" x="-8" y="-8" width="${W + 16}" height="${H + 16}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="${RIM_BLUR}"/>
    </filter>
  </defs>
  <g filter="url(#wm-rimblur)">
    <path d="${d}" stroke="#D6EAFF" stroke-opacity="0.7" stroke-width="${RIM_STROKE}" mask="url(#wm-ins)"/>
  </g>
</svg>
`;

// ---- letters: their ddii filter (two white under-glows, 10% dark fill,
//      two black inner shadows from above), scaled to this viewBox ---------
const letters = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <filter id="wm-ddii" x="-24" y="-24" width="${W + 48}" height="${H + 48}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BIF"/>
      <!-- white under-glow 1: tight, offset below -->
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="hardAlpha"/>
      <feOffset dy="${n(4.619)}"/>
      <feGaussianBlur stdDeviation="${n(3.14)}"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/>
      <feBlend mode="normal" in2="BIF" result="glow1"/>
      <!-- white under-glow 2: wide, soft -->
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="hardAlpha"/>
      <feOffset dy="${n(5.27)}"/>
      <feGaussianBlur stdDeviation="${n(11.505)}"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0"/>
      <feBlend mode="normal" in2="glow1" result="glow2"/>
      <!-- glyph fill: their #00050A at feFuncA slope 0.1, over the glows -->
      <feComponentTransfer in="SourceGraphic" result="translucentFill">
        <feFuncA type="linear" slope="0.1"/>
      </feComponentTransfer>
      <feBlend mode="normal" in="translucentFill" in2="glow2" result="shape"/>
      <!-- inner shadow 1: tight black from above -->
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="hardAlpha"/>
      <feOffset dy="${n(1.47)}"/>
      <feGaussianBlur stdDeviation="${n(5.045)}"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/>
      <feBlend mode="multiply" in2="shape" result="inner1"/>
      <!-- inner shadow 2: broad black from above -->
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="hardAlpha"/>
      <feOffset dy="${n(8.47)}"/>
      <feGaussianBlur stdDeviation="${n(45.545)}"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.1 0"/>
      <feBlend mode="multiply" in2="inner1" result="inner2"/>
    </filter>
  </defs>
  <g filter="url(#wm-ddii)">
    <path d="${d}" fill="#00050A"/>
  </g>
</svg>
`;

// ---- lit: ghost's hover light — the glyphs lit with their glass ramp
//      (pale mint-white body, ice at the letter bottoms), split into a core
//      (sharp-ish + grain) and a bloom (heavier blur → halation past the
//      edges). Both are pool-masked in the component, no glyph clip — like
//      theirs, the light layer's own letterforms shape it ---------------
const gradStops = [
  [0, "#F2FAFF"],
  [0.55, "#DCECE8"],
  [0.86, "#9EF0FF"],
  [1, "#59D2FF"],
]
  .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
  .join("");

const litCore = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="wm-ramp" x1="-60" y1="${b.y1.toFixed(2)}" x2="${W + 60}" y2="${b.y2.toFixed(2)}" gradientUnits="userSpaceOnUse">${gradStops}</linearGradient>
    <filter id="wm-core" x="-12" y="-12" width="${W + 24}" height="${H + 24}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="${n(3.4)}"/>
    </filter>
    <filter id="wm-grain" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="11" stitchTiles="stitch" result="t"/>
      <feColorMatrix in="t" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.96  0 0 0 0 1  0.5 0 0 0 0" result="c"/>
      <feComposite in="c" in2="SourceGraphic" operator="in"/>
      <feGaussianBlur stdDeviation="1.6"/>
    </filter>
  </defs>
  <g filter="url(#wm-core)">
    <path d="${d}" fill="url(#wm-ramp)"/>
  </g>
  <path d="${d}" fill="#fff" filter="url(#wm-grain)"/>
</svg>
`;

const litBloom = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="wm-ramp" x1="-60" y1="${b.y1.toFixed(2)}" x2="${W + 60}" y2="${b.y2.toFixed(2)}" gradientUnits="userSpaceOnUse">${gradStops}</linearGradient>
    <filter id="wm-bloom" x="-24" y="-24" width="${W + 48}" height="${H + 48}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feOffset dx="3.5" dy="2.5"/>
      <feGaussianBlur stdDeviation="${n(7.5)}"/>
    </filter>
  </defs>
  <g filter="url(#wm-bloom)" opacity="0.8">
    <path d="${d}" fill="url(#wm-ramp)"/>
  </g>
</svg>
`;

fs.writeFileSync("../../public/engraved-rim.svg", rim);
fs.writeFileSync("../../public/engraved-letters.svg", letters);
fs.writeFileSync("../../public/engraved-lit.svg", litCore);
fs.writeFileSync("../../public/engraved-lit-bloom.svg", litBloom);
fs.writeFileSync(
  "wordmark-meta.json",
  JSON.stringify({ w: W, h: H, x1: +b.x1.toFixed(2), y1: +b.y1.toFixed(2), k }, null, 1),
);
console.log(`baked ${W}x${H} (k=${k.toFixed(4)}), path ${d.length} bytes`);
