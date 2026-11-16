// @rstest-environment jsdom
// How a page carries its baked frames (`bake-frames.ts`): its canvases
// numbered in source order outside scripts and styles, each baked one its
// attribute, the stylesheet showing it at the end of the head, one rule an
// image, and the kit's runtime reading that attribute as the build wrote it.
import { describe, expect, it } from "rstack/test"
import { bakedSettled, BAKED_ATTR, PRINT_ATTR, releaseBaked } from "@dither-ui/kit/engine/baked.ts"
import { bakedCss, bakedValue, bakeHtml, bakePrints, tagCanvases, type Bake } from "../src/bake-frames.ts"

const PAGE =
  `<!doctype html><html class="dark"><head><title>t</title></head><body>` +
  `<canvas class="a"></canvas>` +
  `<script>const s = "<canvas x>"</script>` +
  `<div><canvas style="position:absolute;width:0px;height:0px"></canvas></div>` +
  `<canvas></canvas></body></html>`

const bake = (n: number, over: Partial<Bake> = {}): Bake => ({
  n,
  kind: "settled",
  width: 2,
  height: 1,
  png: "AAAA",
  dark: true,
  above: false,
  ...over,
})

describe("baked frames in a page", () => {
  it("numbers the markup's canvases and never one inside a script", () => {
    const { html, zero } = tagCanvases(PAGE)
    expect(zero).toEqual([false, true, false])
    expect(html).toContain(`<script>const s = "<canvas x>"</script>`)
    expect(html.match(/data-dk-n="\d"/g)).toEqual(['data-dk-n="0"', 'data-dk-n="1"', 'data-dk-n="2"'])
  })

  it("marks each baked canvas and shows it from the head", () => {
    const bakes = [bake(0), bake(2, { kind: "first", png: "BBBB" })]
    const html = bakeHtml(PAGE, bakes)
    document.documentElement.innerHTML = html.replace(/^<!doctype html><html[^>]*>/, "").replace(/<\/html>$/, "")
    const canvases = [...document.querySelectorAll("canvas")]
    expect(canvases.map((c) => c.getAttribute(BAKED_ATTR))).toEqual([bakedValue(bakes[0]), null, bakedValue(bakes[1])])
    expect(canvases.map((c) => bakedSettled(c))).toEqual([true, false, false])
    expect(html.indexOf("<style data-dk-bakes>")).toBeLessThan(html.indexOf("</head>"))
    releaseBaked(canvases[0])
    expect(bakedSettled(canvases[0])).toBe(false)
  })

  it("leaves a page with nothing baked as it was", () => {
    expect(bakeHtml(PAGE, [])).toBe(PAGE)
  })

  it("writes one rule an image, in its theme, a 0x0 canvas placed in its box", () => {
    const css = bakedCss([bake(0), bake(3), bake(1, { inset: [36, 10, 0, 24], dark: false })])
    expect(css.match(/url\(/g)).toHaveLength(2)
    expect(css).toContain(`:root.dark [${BAKED_ATTR}="${bakedValue(bake(0))}"]`)
    expect(css).toContain(":root:not(.dark)")
    expect(css).toContain("left:36px!important;top:10px!important;right:0px!important;bottom:24px!important")
  })

  it("writes a large frame further down beside the page, one in the first window into it", () => {
    const large = "A".repeat(4096)
    const css = bakedCss([bake(0, { png: large }), bake(1, { png: large + "B", above: true }), bake(2)], "/base/baked/")
    expect(css.match(/url\(\/base\/baked\/[0-9a-f]{10}\.png\)/g)).toHaveLength(1)
    expect(css.match(/url\(data:image\/png;base64,/g)).toHaveLength(2)
  })

  it("moves a chart's prints into files named by their bytes when together they pass 1.5 kB, else keeps them", () => {
    const large = "QUJD".repeat(600)
    const small = "QUJD".repeat(150)
    const print = (png: string) => `<image ${PRINT_ATTR} width="3" height="2" href="data:image/png;base64,${png}"/>`
    const chart = (...pngs: string[]) =>
      `<svg data-hk="1" class="dk-chart absolute"><g><svg class="dk-chart-print">${pngs.map(print).join("")}</svg></g></svg>`
    const page =
      `<html><head></head><body>${chart(large)}${chart(small)}${chart(small, small, small, small)}${chart(large)}` +
      `<svg><image width="1" height="1" href="data:image/png;base64,${large}"/></svg>` +
      `<script>const s = '${chart(large)}'</script></body></html>`
    const { html, prints } = bakePrints(page, "/base/baked/")
    expect(prints.map((p) => p.png).sort()).toEqual([large, small].sort())
    const file = (png: string) => `href="/base/baked/${prints.find((p) => p.png === png)!.name}"`
    expect(html.split(file(large))).toHaveLength(3) // both large charts, one file
    expect(html.split(file(small))).toHaveLength(5) // the four small bars of one chart, over the limit together
    expect(html).toContain(chart(small)) // one small print alone stays
    expect(html).toContain(`<image width="1" height="1" href="data:image/png;base64,${large}"/>`)
    expect(html).toContain(`<script>const s = '${chart(large)}'</script>`)
    expect(bakePrints(html, "/base/baked/").prints).toEqual([])
  })
})
