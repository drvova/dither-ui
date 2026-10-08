// GLSL for the dither engine: the pure half of DitherShader. `wrapShader`
// turns a user fragment shader — Shadertoy's `mainImage(out vec4, in vec2)`
// or a raw `void main()` — into a linkable program for WebGL2 (GLSL ES 3.00)
// or WebGL1 (1.00), and `ditherShaderPixels` takes the GPU's readback and
// ordered-dithers it into a RasterBuffer like every other surface: the GPU is
// only the evaluator, the Bayer cell stays the look. `sampleShader` writes the
// seeded default source so a seed alone is a complete, different shader.

import { clamp01, xorshift32 } from "./pixel"
import type { Rgb } from "./palette"
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
  "iResolution", "iTime", "iTimeDelta", "iFrame", "iMouse", "iDate",
  "resolution", "time", "mouse", "u_resolution", "u_time", "u_mouse",
] as const

const SHADERTOY_UNIFORMS = `uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
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
      fragment: `precision highp float;\nprecision highp int;\n${SHADERTOY_UNIFORMS}#line 1\n${body}\nvoid main() { vec4 c = vec4(0.0); mainImage(c, gl_FragCoord.xy); gl_FragColor = c; }\n`,
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
}

/**
 * GL readback (RGBA, rows bottom-up) → the raster, ordered-dithered. Colour
 * mode quantizes each channel to `levels` through the Bayer cell; mono mode
 * thresholds luminance and paints the tint, unlit cells at `shade` alpha.
 * The shader's own alpha carries through.
 */
export function ditherShaderPixels(src: Uint8Array, buffer: RasterBuffer, p: ShaderDither): void {
  const cols = buffer.width
  const rows = buffer.height
  const data = buffer.data
  const d = clamp01(p.dither)
  const steps = Math.max(1, Math.round(p.levels) - 1)
  const shade = clamp01(p.shade)
  const mono = p.mono
  for (let y = 0; y < rows; y++) {
    const srow = (rows - 1 - y) * cols
    const my = p.matrix[y & 3]
    for (let x = 0; x < cols; x++) {
      const s = (srow + x) * 4
      const o = (y * cols + x) * 4
      const th = my[x & 3]
      const a = src[s + 3]
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
