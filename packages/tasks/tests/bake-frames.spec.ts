// @rstest-environment jsdom
// How a page carries its baked frames (`bake-frames.ts`): its canvases
// numbered in source order outside scripts and styles, each baked one its
// attribute, the stylesheet showing it at the end of the head, one rule an
// image, and the kit's runtime reading that attribute as the build wrote it.
import { describe, expect, it } from "rstack/test"
import { bakedSettled, BAKED_ATTR, releaseBaked } from "@dither-ui/kit/engine/baked.ts"
import { bakedCss, bakedValue, bakeHtml, tagCanvases, type Bake } from "../src/bake-frames.ts"

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
})
