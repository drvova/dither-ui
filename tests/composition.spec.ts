import { describe, expect, it } from "vitest"
import { createArtboard } from "@/entities/artboard"
import { compositionHtml, embedJson, normalizeVideoOptions, slugOf } from "@/features/export-video/composition"

describe("HyperFrames composition", () => {
  const frame = { ...createArtboard("area"), name: "Sign in / Q3 <draft>", w: 520.4, h: 360 }

  it("declares the composition contract on the root and embeds the frame", () => {
    const html = compositionHtml(frame, { seconds: 6, fps: 30, theme: "dark" }, { js: "console.log(1)", css: ".a{}" })
    expect(html).toContain('<html lang="en" class="dark">')
    expect(html).toContain(`data-composition-id="dither-sign-in-q3-draft"`)
    expect(html).toContain('data-width="520" data-height="360" data-duration="6" data-fps="30" data-no-timeline>')
    expect(html).toContain(`data-artboard="${frame.id}" data-theme="dark"`)
    expect(html).toContain("<style>.a{}</style>")
    expect(html).toContain("<script>console.log(1)</script>")
    expect(html).toContain("npx hyperframes render -c sign-in-q3-draft.hyperframes.html -o sign-in-q3-draft.mp4")
    expect(html).toContain("<title>Sign in / Q3 &lt;draft&gt; — dither-ui</title>")
    const json = html.match(/<script type="application\/json" id="dither-document">(.*?)<\/script>/s)?.[1] ?? ""
    expect(JSON.parse(json).artboards[0].name).toBe("Sign in / Q3 <draft>")
    expect(json).not.toContain("<")
  })

  it("keeps an inlined bundle from closing its own script block, and can reference the player instead", () => {
    const inline = compositionHtml(frame, { seconds: 2, fps: 60, theme: "light" }, { js: 'x("</script><b>")', css: "" })
    expect(inline).toContain('<html lang="en">')
    expect(inline).toContain('x("<\\/script><b>")')
    expect(inline.match(/<\/script>/g)?.length).toBe(2) // the document + the bundle
    const refs = compositionHtml(frame, { seconds: 2, fps: 24, theme: "dark" }, { jsRef: "./player.js", cssRef: "./player.css" })
    expect(refs).toContain('<link rel="stylesheet" href="./player.css" />')
    expect(refs).toContain('<script src="./player.js"></script>')
    expect(refs).toContain('data-fps="24"')
  })

  it("normalizes options and names", () => {
    expect(normalizeVideoOptions(undefined)).toEqual({ seconds: 6, fps: 30, theme: "dark" })
    expect(normalizeVideoOptions({ seconds: 9999, fps: 60, theme: "light" })).toEqual({ seconds: 600, fps: 60, theme: "light" })
    expect(normalizeVideoOptions({ seconds: "x", fps: 50, theme: "sepia" })).toEqual({ seconds: 6, fps: 30, theme: "dark" })
    expect(normalizeVideoOptions({ seconds: 0.004 })).toEqual({ seconds: 1, fps: 30, theme: "dark" })
    expect(slugOf("  ")).toBe("frame")
    expect(embedJson({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}')
  })
})
