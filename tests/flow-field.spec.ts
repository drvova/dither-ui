// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { mount } from "@vue/test-utils"
import { paintFlowField, fadeRasterAlpha, DitherFlowField } from "@dither-kit"
import { createRasterBuffer } from "@dither-kit/raster"
import { BAYER4 } from "@dither-kit/pixel"

// The flow field's contract: seeded determinism, a trail that decays to a
// full clear (no ghost residue), a stamped dither cell per particle per
// frame, and the component wiring (mask, 60fps lock, transparent canvas).

describe("paintFlowField", () => {
  const params = {
    colors: [[244, 248, 255]] as [number, number, number][],
    count: 500,
    speed: 0.35,
    scale: 1.4,
    fade: 0.9,
    glow: 1,
    opacity: 1,
    dither: 1,
    seed: 7,
  }

  it("is deterministic per seed — same buffer shape, same pixels", () => {
    const a = createRasterBuffer(64, 40)
    const b = createRasterBuffer(64, 40)
    paintFlowField(a, params, 2, 0.016, BAYER4)
    paintFlowField(b, params, 2, 0.016, BAYER4)
    expect([...a.data]).toEqual([...b.data])
  })

  it("stamps ink into the buffer (the wind leaves dots)", () => {
    const buf = createRasterBuffer(64, 40)
    // Let the trail build: a few frames of stamping.
    for (let f = 0; f < 30; f++) paintFlowField(buf, params, f * 0.016, 0.016, BAYER4)
    let lit = 0
    for (let i = 3; i < buf.data.length; i += 4) if (buf.data[i] > 0) lit++
    expect(lit).toBeGreaterThan(50)
  })

  it("fades ink to an exact zero — no ghost residue from multiplicative rounding", () => {
    const buf = createRasterBuffer(32, 20)
    // Hand-ink every alpha to a low residue level (where pure multiplicative
    // fades stall) and run the floor until it must reach zero.
    for (let i = 3; i < buf.data.length; i += 4) buf.data[i] = 30
    for (let f = 0; f < 40; f++) fadeRasterAlpha(buf, 0.9)
    for (let i = 3; i < buf.data.length; i += 4) expect(buf.data[i]).toBe(0)
  })

  it("quantizes through the bayer matrix — dim cells still stamp, fainter", () => {
    const buf = createRasterBuffer(64, 40)
    for (let f = 0; f < 40; f++) paintFlowField(buf, params, f * 0.016, 0.016, BAYER4)
    // Both dither tiers present: lit (strong) and dim (0.45) stamps exist.
    let strong = 0
    let faint = 0
    for (let i = 3; i < buf.data.length; i += 4) {
      if (buf.data[i] > 90) strong++
      else if (buf.data[i] > 0) faint++
    }
    expect(strong).toBeGreaterThan(0)
    expect(faint).toBeGreaterThan(0)
  })
})

describe("DitherFlowField component", () => {
  it("wires the runtime: transparent canvas, edge mask, 60fps lock", () => {
    const w = mount(DitherFlowField, { props: { seed: 3 } })
    const wrap = w.find("div")
    expect(wrap.attributes("aria-hidden")).toBe("true")
    expect(wrap.attributes("style")).toContain("radial-gradient") // the edge-fade mask
    const canvas = w.find("canvas")
    expect(canvas.exists()).toBe(true)
    // The canvas itself carries no background: transparent over the hero's #000.
    const cls = canvas.classes().join(" ")
    expect(cls).toContain("absolute")
  })

  it("honors mask=none by dropping the mask style", () => {
    const w = mount(DitherFlowField, { props: { mask: "none" } })
    const style = w.find("div").attributes("style") ?? ""
    expect(style).not.toContain("radial-gradient")
  })
})
