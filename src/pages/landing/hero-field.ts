// The hero's field (after dithercn.dev's): a horizon of light bowing across
// the foot of the band, its crest stirring slowly, under a sky of sparse
// stars that blink, clear behind the statement. Shadertoy GLSL for the
// kit's DitherShader, which reads its luminance back onto the ramp through
// the Bayer cells.
export const HERO_FIELD = /* glsl */ `
// A hash without sin: sin of a large argument loses its precision on the
// GPU, and no cell ever cleared the stars' threshold.
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float x = (uv.x - 0.5) * iResolution.x / iResolution.y;
  float t = iTime * 0.12;
  // The crest: a wide arc, highest in the middle, stirred by slow noise.
  float arc = sqrt(max(0.0, 1.0 - pow(x / 0.95, 2.0)));
  float crest = 0.06 + 0.2 * arc + 0.03 * (noise(vec2(x * 1.4 + t, t * 0.6)) - 0.5);
  float d = uv.y - crest;
  // Bright on the crest, falling off fast above it and below it, and gone
  // at the band's foot so the page takes over.
  float band = d > 0.0 ? exp(-d * 30.0) : exp(d * 16.0) * 0.55;
  band *= 0.65 + 0.35 * noise(vec2(x * 6.0 - t * 2.0, uv.y * 22.0));
  band *= smoothstep(0.0, 0.08, uv.y);
  // Stars: one cell in four hundred, blinking, none down in the band and
  // none behind the statement (an oval clear around the page's text).
  float s = hash(floor(fragCoord));
  float star = step(0.9975, s) * (0.75 + 0.25 * sin(iTime * (0.8 + s * 2.0) + s * 40.0));
  star *= smoothstep(crest + 0.08, crest + 0.3, uv.y);
  star *= smoothstep(0.32, 0.5, length(vec2(x * 0.62, uv.y - 0.62)));
  fragColor = vec4(vec3(clamp(band + star, 0.0, 1.0)), 1.0);
}
`

/** The design system's metals, dark to light: obsidian, graphite, titanium,
 * chrome. */
export const HERO_RAMP = ["#08090b", "#25292d", "#a6abb1", "#d4dce1"]
