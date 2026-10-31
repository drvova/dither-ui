// The footer's ground: one DitherShader under the footer prints a star grain
// on the obsidian and, across the road at its foot, a bundle of light trails
// that comes in from the left, runs under the brand's diamond and sweeps out
// and down to the right, widening as it nears. Luminance picks the ink (the
// ramp: the ground, then the print's inks), so the trails burn bone at their
// heads and core and cool through the ember to blue along their tails and
// edges; the grain thickens into a spray along the bundle. Only the trails'
// heads move, along their threads, and the art dissolves at its edges.
import { GROUND, INKS } from "./plate"

/** The road: its height as a share of the footer's width (the art scales
 * like a print; a taller share under `narrow` px), where the diamond's
 * centre stands on it (fractions of the width and of the road's height from
 * its foot), and the shader's cell in CSS px (the page pins its dpr to 1,
 * so its width in cells times `cell` is the footer's CSS width). The page
 * sizes the road and places the diamond from these; the shader runs the
 * trails through the same point, telling the narrow layout by that width. */
export const ROAD = { aspect: 0.3, narrowAspect: 0.6, narrow: 640, mark: [0.58, 0.55], cell: 3 } as const

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
  // The centreline through the diamond, falling away ahead of it; the
  // bundle's half-width, narrow behind and opening ahead.
  float cy = MARK.y - 0.12 * d - 2.2 * ahead * ahead + 0.02 * sin(p.x * 9.0);
  float w = 0.06 + 0.5 * pow(ahead, 1.5);
  float s = (p.y - cy) / w;
  // The art dissolves at its edges into the page: in from the footer's top,
  // out toward its foot, so it never shows a box.
  float top = (iResolution.y - fragCoord.y) / iResolution.x;
  float foot = smoothstep(0.0, 0.3, p.y) * smoothstep(0.0, 0.12, top);
  float lum = 0.0;
  if (abs(s) < 1.0) {
    float across = (s + 1.0) * 0.5 * THREADS;
    float h = hash(vec2(floor(across), 7.0));
    // Each thread's light runs ahead, faster as the road nears; its tail
    // cools behind it. Hottest at the core, a dark cell between threads.
    float run = fract(p.x * (4.0 + 4.0 * h) - iTime * (0.1 + 0.08 * h) * (1.0 + 2.0 * ahead) + h);
    float heat = 0.5 + 0.7 * (1.0 - abs(s)) + 0.1 * (h - 0.5);
    float seam = step(0.2, fract(across));
    // Its tail comes out of the dark at the left; its front runs off the right.
    float edge = (1.0 - smoothstep(0.8, 1.0, abs(s))) * smoothstep(0.0, 0.18, p.x);
    lum = min(1.0, heat * (0.22 + 0.78 * run * run)) * mix(0.5, 1.0, seam) * edge * foot;
  } else {
    // The grain: rare and blue over the columns, a spray along the bundle
    // with bone among it.
    float road = step(p.y, 1.0);
    float spray = exp(-(abs(s) - 1.0) * 1.6) * road;
    float density = (mix(0.002, 0.0003, smoothstep(0.7, 1.3, p.y)) + 0.05 * spray) * foot;
    vec2 c = floor(fragCoord);
    if (hash(c) < density) lum = hash(c + 31.0) < 1.0 - 0.3 * road ? 1.0 / 3.0 : 1.0;
  }
  fragColor = vec4(vec3(lum), lum > 0.0 ? 1.0 : 0.0);
}
`
