// GLSL for the dither engine: the pure half of DitherShader. `wrapShader`
// turns a user fragment shader — Shadertoy's `mainImage(out vec4, in vec2)`
// or a raw `void main()` — into a linkable program for WebGL2 (GLSL ES 3.00)
// or WebGL1 (1.00), and `ditherShaderPixels` takes the GPU's readback and
// ordered-dithers it into a RasterBuffer like every other surface: the GPU is
// only the evaluator, the Bayer cell stays the look. `sampleShader` writes the
// seeded default source so a seed alone is a complete, different shader.

import { clamp01, xorshift32 } from "./pixel"
import { sampleRgbGradient, type Rgb } from "./palette"
import type { RasterBuffer } from "./raster"

export type ShaderConvention = "shadertoy" | "raw"

export type ShaderProgram = {
  vertex: string
  fragment: string
  convention: ShaderConvention
  /** GLSL ES version the program needs: 2 is `#version 300 es`. */
  version: 1 | 2
}

/** Uniforms the runtime feeds, Shadertoy names first then common aliases
 * (glslsandbox `time`/`resolution`/`mouse`, Book of Shaders `u_*`). */
export const SHADER_UNIFORMS = [
  "iResolution", "iTime", "iTimeDelta", "iFrame", "iMouse", "iDate", "iColor", "iSeed",
  "iChannel0", "iChannel1", "iChannel2", "iChannel3", "iChannelResolution", "iChannelTime",
  "resolution", "time", "mouse", "u_resolution", "u_time", "u_mouse",
] as const

/** The kit's helpers for any GLSL here: `dk_bayer4(fragCoord)` is the 4x4
 * Bayer threshold for that pixel in closed form, so a shader can dither in
 * its own terms. */
const KIT_HELPERS = `float dk_bayer2(float x, float y) { return 2.0 * x + 3.0 * y - 4.0 * x * y; }
float dk_bayer4(vec2 p) {
  float x0 = mod(floor(p.x), 2.0);
  float y0 = mod(floor(p.y), 2.0);
  float x1 = mod(floor(p.x / 2.0), 2.0);
  float y1 = mod(floor(p.y / 2.0), 2.0);
  return (4.0 * dk_bayer2(x0, y0) + dk_bayer2(x1, y1) + 0.5) / 16.0;
}
`

/** The Shadertoy set plus the kit's: `iColor` (the component's colour, 0-1)
 * and `iSeed`; `iChannel0..3` are other kit surfaces (or any canvas, image
 * or video) bound as textures, upright, `iChannelResolution` their sizes. */
const SHADERTOY_UNIFORMS = `uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform vec3 iColor;
uniform float iSeed;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec3 iChannelResolution[4];
uniform float iChannelTime[4];
${KIT_HELPERS}`

/** A world material's view of the finished target (`world.ts`
 * WorldTarget, packed into one texture: R shade, G palette index / 255,
 * B + A a 16-bit depth across the bounding sphere), the palette, the
 * texture coordinates (`packUv`: R + G a 16-bit s, B + A a 16-bit t offset
 * by one, 0 where the mesh has none) and the channels: `dk_uv(p)` is the
 * cell's st ready for `texture(iChannelN, …)` (t flipped to GL's),
 * `dk_textured(p)` whether the mesh has uvs, `dk_texture(p)` iChannel0
 * sampled there. */
const MATERIAL_UNIFORMS = `uniform sampler2D dk_target;
uniform sampler2D dk_palette;
uniform sampler2D dk_uvmap;
uniform vec3 iResolution;
uniform float iTime;
uniform vec3 iColor;
uniform float iSeed;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec3 iChannelResolution[4];
uniform float iChannelTime[4];
${KIT_HELPERS}vec4 dk_cell(vec2 p) { return texture(dk_target, (floor(p) + 0.5) / iResolution.xy); }
float dk_shade(vec2 p) { return dk_cell(p).r; }
bool dk_covered(vec2 p) { return dk_cell(p).g > 0.0; }
float dk_depth(vec2 p) { vec4 t = dk_cell(p); return t.g > 0.0 ? (t.b * 65280.0 + t.a * 255.0) / 65535.0 : 1.0; }
vec3 dk_color(vec2 p) { float i = dk_cell(p).g * 255.0; return texture(dk_palette, vec2((i - 0.5) / 256.0, 0.5)).rgb; }
vec4 dk_uvcell(vec2 p) { return texture(dk_uvmap, (floor(p) + 0.5) / iResolution.xy); }
bool dk_textured(vec2 p) { vec4 t = dk_uvcell(p); return t.b + t.a > 0.0; }
vec2 dk_uv(vec2 p) { vec4 t = dk_uvcell(p); float v = t.b * 65280.0 + t.a * 255.0; return vec2((t.r * 65280.0 + t.g * 255.0) / 65535.0, v > 0.0 ? 1.0 - (v - 1.0) / 65534.0 : 0.0); }
vec4 dk_texture(vec2 p) { return texture(iChannel0, dk_uv(p)); }
`

const VERTEX_1 = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }"
const VERTEX_2 = "#version 300 es\nin vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }"

/**
 * Build the program around a user fragment shader. A `mainImage` entry point
 * gets Shadertoy's uniforms and a `main` that calls it (ES 3.00 when the
 * context is WebGL2, else 1.00); a raw shader compiles as written, with a
 * default float precision added when it declares none.
 */
export function wrapShader(source: string, webgl2: boolean): ShaderProgram {
  const src = source.replace(/\r\n?/g, "\n")
  const es3 = /^\s*#version\s+300\s+es/.test(src)
  if (/\bmainImage\s*\(/.test(src)) {
    const body = src.replace(/^\s*#version[^\n]*\n/, "")
    if (webgl2)
      return {
        vertex: VERTEX_2,
        fragment: `#version 300 es\nprecision highp float;\nprecision highp int;\n${SHADERTOY_UNIFORMS}out vec4 dither_FragColor;\n#line 1\n${body}\nvoid main() { mainImage(dither_FragColor, gl_FragCoord.xy); }\n`,
        convention: "shadertoy",
        version: 2,
      }
    return {
      vertex: VERTEX_1,
      fragment: `precision highp float;\nprecision highp int;\n#define texture texture2D\n${SHADERTOY_UNIFORMS}#line 1\n${body}\nvoid main() { vec4 c = vec4(0.0); mainImage(c, gl_FragCoord.xy); gl_FragColor = c; }\n`,
      convention: "shadertoy",
      version: 1,
    }
  }
  const needsPrecision = !es3 && !/\bprecision\s+(lowp|mediump|highp)\s+float\b/.test(src)
  return {
    vertex: es3 ? VERTEX_2 : VERTEX_1,
    fragment: needsPrecision ? `precision highp float;\n#line 1\n${src}` : src,
    convention: "raw",
    version: es3 ? 2 : 1,
  }
}

/**
 * Build a world material: a fragment function over the finished target —
 * `mainMaterial(out vec4 fragColor, in vec2 fragCoord)` (or a Shadertoy
 * `mainImage`) reading `dk_shade`, `dk_depth`, `dk_covered`, `dk_color`,
 * `dk_uv` / `dk_texture` (the channels on the surface) per cell and
 * returning rgb + the shade the dither pass thresholds.
 */
export function wrapMaterial(source: string, webgl2: boolean): ShaderProgram {
  const body = source.replace(/\r\n?/g, "\n").replace(/^\s*#version[^\n]*\n/, "")
  const entry = /\bmainMaterial\s*\(/.test(body) ? "mainMaterial" : "mainImage"
  if (webgl2)
    return {
      vertex: VERTEX_2,
      fragment: `#version 300 es\nprecision highp float;\nprecision highp int;\n${MATERIAL_UNIFORMS}out vec4 dither_FragColor;\n#line 1\n${body}\nvoid main() { ${entry}(dither_FragColor, gl_FragCoord.xy); }\n`,
      convention: "shadertoy",
      version: 2,
    }
  return {
    vertex: VERTEX_1,
    fragment: `precision highp float;\nprecision highp int;\n#define texture texture2D\n${MATERIAL_UNIFORMS}#line 1\n${body}\nvoid main() { vec4 c = vec4(0.0); ${entry}(c, gl_FragCoord.xy); gl_FragColor = c; }\n`,
    convention: "shadertoy",
    version: 1,
  }
}

export type ShaderDither = {
  /** 4x4 Bayer thresholds (seeded or default). */
  matrix: number[][]
  /** 0 smooth → 1 fully quantized. */
  dither: number
  /** Colour levels per channel when not mono (2 = 1-bit, the 8-colour look). */
  levels: number
  /** Tint for the 1-bit luminance mode; null keeps the shader's colours. */
  mono: Rgb | null
  /** Mono: alpha floor of the unlit cells, 0-1. */
  shade: number
  /** A palette ramp, dark to light: luminance picks the band, the Bayer
   * cell dithers between bands (wins over mono and levels). */
  palette?: Rgb[] | null
}

/**
 * GL readback (RGBA, rows bottom-up) → the raster, ordered-dithered. Colour
 * mode quantizes each channel to `levels` through the Bayer cell; mono mode
 * thresholds luminance and paints the tint, unlit cells at `shade` alpha; a
 * palette dithers luminance across its bands. The shader's own alpha
 * carries through.
 */
export function ditherShaderPixels(src: Uint8Array, buffer: RasterBuffer, p: ShaderDither): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const d = clamp01(p.dither)
  const steps = Math.max(1, Math.round(p.levels) - 1)
  const shade = clamp01(p.shade)
  const mono = p.mono
  const palette = p.palette && p.palette.length >= 2 ? p.palette : null
  const bands = palette ? palette.length : 0
  const smooth: [number, number, number] = [0, 0, 0]
  for (let y = 0; y < rows; y++) {
    const srow = (rows - 1 - y) * cols
    const my = p.matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const s = (srow + x) * 4
      const o = (y * cols + x) * 4
      const th = my[x & 3]
      const a = src[s + 3]
      if (palette) {
        const lum = (0.2126 * src[s] + 0.7152 * src[s + 1] + 0.0722 * src[s + 2]) / 255
        const col = palette[Math.min(bands - 1, Math.floor(lum * (bands - 1) + th))]
        if (d < 1) {
          sampleRgbGradient(palette, lum, smooth)
          data[o] = Math.round(smooth[0] * (1 - d) + col[0] * d)
          data[o + 1] = Math.round(smooth[1] * (1 - d) + col[1] * d)
          data[o + 2] = Math.round(smooth[2] * (1 - d) + col[2] * d)
        } else {
          data[o] = col[0]
          data[o + 1] = col[1]
          data[o + 2] = col[2]
        }
        data[o + 3] = a
        continue
      }
      if (mono) {
        const lum = (0.2126 * src[s] + 0.7152 * src[s + 1] + 0.0722 * src[s + 2]) / 255
        const q = lum + th >= 1 ? 1 : 0
        const v = lum * (1 - d) + q * d
        data[o] = mono[0]
        data[o + 1] = mono[1]
        data[o + 2] = mono[2]
        data[o + 3] = Math.round((shade + (1 - shade) * v) * a)
        continue
      }
      for (let c = 0; c < 3; c++) {
        const v = src[s + c] / 255
        const q = Math.floor(v * steps + th) / steps
        data[o + c] = Math.round((v * (1 - d) + q * d) * 255)
      }
      data[o + 3] = a
    }
  }
}

/** Shadertoy-style GLSL for a seeded plasma: rings, arms and a cosine palette
 * whose frequencies and phases come from the seed. Every seed is a different
 * shader, all of them real GLSL the component compiles like a user's. */
export function sampleShader(seed = 0): string {
  const rand = xorshift32(Math.round(seed) || 0x9e3779b9)
  const n = (v: number) => (Math.round(v * 1000) / 1000).toFixed(3)
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo)
  const rings = between(3, 11)
  const arms = Math.floor(between(2, 7))
  const weave = between(0.3, 0.9)
  const fx = between(2, 7)
  const fy = between(2, 7)
  const speed = between(0.35, 1.1)
  const pa = [between(0.4, 0.6), between(0.4, 0.6), between(0.4, 0.6)]
  const pb = [between(0.5, 1.5), between(0.5, 1.5), between(0.5, 1.5)]
  const pc = [between(0, 1), between(0.1, 0.9), between(0.2, 1)]
  return `// dither-kit sample shader, seed ${Math.round(seed)} — Shadertoy conventions
vec3 palette(float t) {
  return vec3(${n(pa[0])}, ${n(pa[1])}, ${n(pa[2])}) + 0.5 * cos(6.28318 * (vec3(${n(pb[0])}, ${n(pb[1])}, ${n(pb[2])}) * t + vec3(${n(pc[0])}, ${n(pc[1])}, ${n(pc[2])})));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec2 m = (iMouse.xy - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime * ${n(speed)};
  float d = length(uv);
  float a = atan(uv.y, uv.x);
  float v = sin(d * ${n(rings)} - t) + ${n(weave)} * sin(a * ${arms}.0 + t * 0.5) + sin(uv.x * ${n(fx)} + uv.y * ${n(fy)} + t * 0.7);
  v += 0.6 * exp(-6.0 * length(uv - m)) * step(0.5, iMouse.z);
  vec3 col = palette(v * 0.25 + t * 0.05) * smoothstep(1.2, 0.45, d);
  fragColor = vec4(col, 1.0);
}
`
}
