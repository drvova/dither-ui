import { describe, expect, it } from "vitest"
import { BAYER4 } from "../dither-kit/pixel"
import { createRasterBuffer } from "../dither-kit/raster"
import { ditherShaderPixels, sampleShader, SHADER_UNIFORMS, wrapMaterial, wrapShader, type ShaderDither } from "../dither-kit/shader"

const TOY = "void mainImage(out vec4 o, in vec2 fc) { o = vec4(fc / iResolution.xy, 0.5 + 0.5 * sin(iTime), 1.0); }"
const RAW1 = "uniform float time; void main() { gl_FragColor = vec4(sin(time)); }"
const RAW3 = "#version 300 es\nprecision mediump float;\nout vec4 o; uniform float iTime; void main() { o = vec4(iTime); }"

describe("wrapShader", () => {
  it("wraps Shadertoy sources with the uniforms and an entry point per GLSL version", () => {
    const es3 = wrapShader(TOY, true)
    expect(es3).toMatchObject({ convention: "shadertoy", version: 2 })
    expect(es3.fragment.startsWith("#version 300 es\n")).toBe(true)
    expect(es3.fragment).toContain("uniform vec3 iResolution;")
    expect(es3.fragment).toContain("out vec4 dither_FragColor;")
    expect(es3.fragment).toContain("void main() { mainImage(dither_FragColor, gl_FragCoord.xy); }")
    expect(es3.vertex).toContain("in vec2 p")
    const es1 = wrapShader(TOY, false)
    expect(es1).toMatchObject({ convention: "shadertoy", version: 1 })
    expect(es1.fragment.includes("#version")).toBe(false)
    expect(es1.fragment).toContain("gl_FragColor = c;")
    expect(es1.vertex).toContain("attribute vec2 p")
    // A stray #version in a Shadertoy source never ends up mid-file.
    expect(wrapShader(`#version 300 es\n${TOY}`, true).fragment.indexOf("#version", 1)).toBe(-1)
  })
  it("compiles raw shaders as written, adding a float precision only when missing", () => {
    const r1 = wrapShader(RAW1, true)
    expect(r1).toMatchObject({ convention: "raw", version: 1 })
    expect(r1.fragment.startsWith("precision highp float;\n#line 1\n")).toBe(true)
    expect(r1.vertex).toContain("attribute")
    const r3 = wrapShader(RAW3, true)
    expect(r3).toMatchObject({ convention: "raw", version: 2, fragment: RAW3 })
    expect(r3.vertex.startsWith("#version 300 es")).toBe(true)
    expect(wrapShader("precision lowp float; void main() { gl_FragColor = vec4(1.0); }", false).fragment.startsWith("precision lowp")).toBe(true)
  })
  it("knows every uniform the runtime feeds", () => {
    expect(SHADER_UNIFORMS).toContain("iMouse")
    expect(SHADER_UNIFORMS).toContain("u_resolution")
    expect(SHADER_UNIFORMS).toContain("iChannel3")
    expect(new Set(SHADER_UNIFORMS).size).toBe(SHADER_UNIFORMS.length)
  })
  it("binds channels and the kit's helpers into Shadertoy sources", () => {
    const es3 = wrapShader(TOY, true).fragment
    for (const line of ["uniform sampler2D iChannel0;", "uniform sampler2D iChannel3;", "uniform vec3 iChannelResolution[4];", "uniform vec3 iColor;", "float dk_bayer4(vec2 p)"]) expect(es3).toContain(line)
    const es1 = wrapShader(TOY, false).fragment
    expect(es1).toContain("#define texture texture2D")
    expect(es1.indexOf("#define texture")).toBeLessThan(es1.indexOf("uniform sampler2D iChannel0"))
  })
  it("wraps world materials over the packed target, by either entry point", () => {
    const m = wrapMaterial("void mainMaterial(out vec4 o, in vec2 p) { o = vec4(dk_color(p), dk_shade(p) * float(dk_covered(p)) + dk_depth(p) * 0.0); }", true)
    expect(m.version).toBe(2)
    for (const line of ["uniform sampler2D dk_target;", "uniform sampler2D dk_palette;", "float dk_depth(vec2 p)", "vec3 dk_color(vec2 p)", "bool dk_covered(vec2 p)", "void main() { mainMaterial(dither_FragColor, gl_FragCoord.xy); }"]) expect(m.fragment).toContain(line)
    const toy = wrapMaterial("void mainImage(out vec4 o, in vec2 p) { o = vec4(1.0); }", false)
    expect(toy.version).toBe(1)
    expect(toy.fragment).toContain("mainImage(c, gl_FragCoord.xy)")
    expect(toy.fragment).toContain("#define texture texture2D")
  })
})

const base: ShaderDither = { matrix: BAYER4, dither: 1, levels: 2, mono: null, shade: 0 }
const flat = (w: number, h: number, rgba: number[]) => {
  const src = new Uint8Array(w * h * 4)
  for (let i = 0; i < src.length; i += 4) src.set(rgba, i)
  return src
}
const run = (src: Uint8Array, w: number, h: number, p: Partial<ShaderDither> = {}) => {
  const buf = createRasterBuffer(w, h)
  ditherShaderPixels(src, buf, { ...base, ...p })
  return buf.data
}

describe("ditherShaderPixels", () => {
  it("flips GL's bottom-up rows into the raster", () => {
    const src = new Uint8Array(2 * 2 * 4)
    src.set([255, 0, 0, 255, 255, 0, 0, 255], 0) // GL row 0 = bottom: red
    src.set([0, 0, 255, 255, 0, 0, 255, 255], 8) // GL row 1 = top: blue
    const d = run(src, 2, 2, { dither: 0 })
    expect(Array.from(d.slice(0, 4))).toEqual([0, 0, 255, 255])
    expect(Array.from(d.slice(8, 12))).toEqual([255, 0, 0, 255])
  })
  it("quantizes each channel through the Bayer cell: mid grey becomes half on, half off", () => {
    const d = run(flat(4, 4, [128, 128, 128, 255]), 4, 4)
    let on = 0
    let off = 0
    for (let i = 0; i < d.length; i += 4) {
      expect(d[i]).toBe(d[i + 1])
      expect(d[i + 3]).toBe(255)
      if (d[i] === 255) on++
      else if (d[i] === 0) off++
    }
    expect(on).toBe(8)
    expect(off).toBe(8)
    expect(Array.from(run(flat(4, 4, [128, 128, 128, 255]), 4, 4))).toEqual(Array.from(run(flat(4, 4, [128, 128, 128, 255]), 4, 4)))
  })
  it("dither 0 passes the shader through; levels posterize; alpha carries", () => {
    const smooth = run(flat(2, 2, [10, 200, 90, 77]), 2, 2, { dither: 0 })
    expect(Array.from(smooth.slice(0, 4))).toEqual([10, 200, 90, 77])
    const four = run(flat(4, 4, [120, 120, 120, 255]), 4, 4, { levels: 4 })
    for (let i = 0; i < four.length; i += 4) expect([0, 85, 170, 255]).toContain(four[i])
    const half = run(flat(2, 2, [255, 255, 255, 255]), 2, 2, { dither: 0.5 })
    expect(half[0]).toBe(255)
  })
  it("mono thresholds luminance into the tint, with a shade floor", () => {
    const d = run(flat(4, 4, [128, 128, 128, 255]), 4, 4, { mono: [0, 255, 0] })
    let lit = 0
    for (let i = 0; i < d.length; i += 4) {
      expect([d[i], d[i + 1], d[i + 2]]).toEqual([0, 255, 0])
      if (d[i + 3] === 255) lit++
      else expect(d[i + 3]).toBe(0)
    }
    expect(lit).toBe(8)
    const floored = run(flat(4, 4, [0, 0, 0, 255]), 4, 4, { mono: [255, 0, 0], shade: 0.2 })
    for (let i = 3; i < floored.length; i += 4) expect(floored[i]).toBe(51)
    expect(run(flat(1, 1, [255, 255, 255, 0]), 1, 1, { mono: [255, 0, 0] })[3]).toBe(0)
  })
})

describe("sampleShader", () => {
  it("writes a deterministic Shadertoy-style shader per seed", () => {
    expect(sampleShader(3)).toBe(sampleShader(3))
    expect(sampleShader(3)).not.toBe(sampleShader(4))
    expect(sampleShader(3)).toContain("void mainImage(out vec4 fragColor, in vec2 fragCoord)")
    expect(wrapShader(sampleShader(3), true).convention).toBe("shadertoy")
  })
})
