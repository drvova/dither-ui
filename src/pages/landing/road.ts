// The footer's ground: one DitherShader under the footer prints a star grain
// on the obsidian and, across the road at its foot, a bundle of light trails
// that comes in from the left, runs under the brand's diamond and sweeps out
// and down to the right behind the wordmark, widening as it nears.
// Luminance picks the ink (the ramp: the ground, then the print's inks), so
// the trails burn bone at their heads and core and cool through the ember to
// blue along their tails and edges; the grain thickens into a spray along
// the bundle and turns as a small spiral galaxy around the diamond, its
// heart. The ribbon twists and sways as its heads run, the galaxy turns, and
// the art dissolves at its edges.
import { GROUND, INKS } from "./plate"

/** The road: from the copyright line to the page's foot, the wordmark
 * printed over its lower part. Its height as a share of the footer's width
 * (the art scales like a print; a taller share under `narrow` px), where the
 * diamond's centre stands on it (fractions of the width and of the road's
 * height from its foot), and the shader's cell in CSS px (the page pins its
 * dpr to 1, so its width in cells times `cell` is the footer's CSS width).
 * The page sizes the road and places the diamond from these; the shader runs
 * the trails and turns the galaxy through the same point, telling the narrow
 * layout by that width. `dance` is how long the art moves by itself as the
 * road comes into view: under five seconds, so it needs no pause. */
export const ROAD = {
  aspect: 0.42,
  narrowAspect: 0.75,
  narrow: 640,
  mark: [0.58, 0.68],
  cell: 3,
  dance: 4500,
} as const

/** Dark to light: the ground, then the print's inks, so brightness 1/3,
 * 2/3 and 1 print blue, the ember and bone. */
export const ROAD_RAMP = [GROUND, ...INKS]

const f = (v: number) => v.toFixed(4)

/** The art, Shadertoy GLSL: x in the footer's width, y in the road's height
 * from the footer's foot. */
export const ROAD_SHADER = `
const vec2 MARK = vec2(${f(ROAD.mark[0])}, ${f(ROAD.mark[1])});
const float THREADS = 14.0;

// Arithmetic, so it stays even at any cell (a sine hash clusters there).
float hash(vec2 c) {
  vec3 q = fract(vec3(c.xyx + iSeed * 17.0) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float aspect = iResolution.x * ${f(ROAD.cell)} < ${f(ROAD.narrow)} ? ${f(ROAD.narrowAspect)} : ${f(ROAD.aspect)};
  vec2 p = vec2(fragCoord.x / iResolution.x, fragCoord.y / (iResolution.x * aspect));
  float d = p.x - MARK.x;
  float ahead = max(d, 0.0);
  // The centreline through the diamond, falling away ahead of it and
  // swaying on either side (never at the diamond, which it runs through);
  // the bundle's half-width, narrow behind and opening ahead.
  float sway = 0.035 * sin(p.x * 5.0 - iTime * 0.9) * smoothstep(0.02, 0.25, abs(d));
  float cy = MARK.y - 0.12 * d - 2.2 * ahead * ahead + 0.02 * sin(p.x * 9.0) + sway;
  float w = 0.06 + 0.5 * pow(ahead, 1.5);
  float s = (p.y - cy) / w;
  // The art dissolves at its edges into the page: in from the footer's top,
  // out at the page's foot, so it never shows a box.
  float top = (iResolution.y - fragCoord.y) / iResolution.x;
  float foot = smoothstep(0.0, 0.12, p.y) * smoothstep(0.0, 0.2, top);
  // The galaxy around the diamond, in the road's height (so a phone's is as
  // full as a desktop's): a tilted disc whose two arms wind out from the
  // diamond and turn.
  vec2 g = vec2(d / aspect, (p.y - MARK.y) * 2.0);
  float r = length(g);
  float arms = pow(0.5 + 0.5 * cos(2.0 * (atan(g.y, g.x) - log(r + 1e-4) * 2.6 + iTime * 0.35)), 4.0);
  // It fades out before the road's top, leaving the copyright line its ground.
  float disc = arms * exp(-r / 0.33) * smoothstep(0.08, 0.14, r) * (1.0 - smoothstep(0.8, 0.95, p.y));
  vec2 c = floor(fragCoord);
  float lum = 0.0;
  if (abs(s) < 1.0) {
    // The ribbon twists as it runs: its threads weave over each other.
    float twist = s + 0.22 * sin(p.x * 11.0 - iTime * 1.4) * (1.0 - s * s);
    float across = (twist + 1.0) * 0.5 * THREADS;
    float h = hash(vec2(floor(across), 7.0));
    // Each thread's light runs ahead, faster as the road nears; its tail
    // cools behind it. Hottest at the core, a dark cell between threads.
    float run = fract(p.x * (4.0 + 4.0 * h) - iTime * (0.1 + 0.08 * h) * (1.0 + 2.0 * ahead) + h);
    float heat = 0.5 + 0.7 * (1.0 - abs(s)) + 0.1 * (h - 0.5);
    float seam = step(0.2, fract(across));
    // Its tail comes out of the dark at the left; its front runs off the right.
    float edge = (1.0 - smoothstep(0.8, 1.0, abs(s))) * smoothstep(0.0, 0.18, p.x);
    lum = min(1.0, heat * (0.22 + 0.78 * run * run)) * mix(0.5, 1.0, seam) * edge * foot;
  }
  if (lum == 0.0 && hash(c + 53.0) < 0.7 * disc * foot) {
    // The galaxy's grain: bone at its heart, the ember, then blue outward.
    lum = r < 0.17 ? 1.0 : r < 0.29 ? 2.0 / 3.0 : 1.0 / 3.0;
  } else if (lum == 0.0) {
    // The grain: rare and blue over the columns, a field of it over the
    // road (behind the wordmark too), thickening into a spray along the
    // bundle with bone among it.
    float road = step(p.y, 1.0);
    float spray = exp(-(abs(s) - 1.0) * 1.6) * road * step(1.0, abs(s));
    float density = (mix(0.004, 0.0003, smoothstep(0.85, 1.3, p.y)) + 0.05 * spray) * foot;
    if (hash(c) < density) lum = hash(c + 31.0) < 1.0 - 0.3 * road ? 1.0 / 3.0 : 1.0;
  }
  fragColor = vec4(vec3(lum), lum > 0.0 ? 1.0 : 0.0);
}
`
