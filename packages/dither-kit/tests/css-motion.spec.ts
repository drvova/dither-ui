// The kit's UI motion is class names (the user's call): transitions and
// keyframes in the components' stylesheets, state set as an attribute or a
// class, and the kit clock holding the CSS when directed (engine/clock.ts).
// What still runs frames in JS is listed here, each with why: a canvas the
// dither is drawn on, a dithered mask, a pointer the product follows, a
// frame that moves nothing, or the one piece left for the user's decision.
// A component that drives its UI by animation frames, Element.animate, a
// cadence on the kit clock or an interval and is not listed fails.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"

const SOLID = new URL("../src/solid/", import.meta.url)

/** A frame loop, a Web Animation made in script, a cadence on the kit clock, an interval. */
const DRIVES = /requestAnimationFrame|\.animate\(|createKitTime\(|setInterval\(/

const STILL_JS: Record<string, string> = {
  // the dither is drawn on a canvas, frame by frame or once after layout
  "Antigravity.tsx": "canvas: motes drawn on the kit clock",
  "ClickSpark.tsx": "canvas: sparks drawn where the click lands",
  "DitherAccordion.tsx": "canvas: the rail painted once laid out",
  "DitherAvatar.tsx": "canvas",
  "DitherBadge.tsx": "canvas",
  "DitherButton.tsx": "canvas",
  "DitherCheckbox.tsx": "canvas",
  "DitherCollapsible.tsx": "canvas: the rail painted once laid out",
  "DitherGauge.tsx": "canvas: the band is printed to the needle as it settles",
  "DitherMeter.tsx": "canvas",
  "DitherNavMenu.tsx": "canvas",
  "DitherProgress.tsx": "canvas",
  "DitherRadioGroup.tsx": "canvas",
  "DitherScope.tsx": "canvas",
  "DitherSeparator.tsx": "canvas",
  "DitherSidebarItem.tsx": "canvas",
  "DitherSkeleton.tsx": "canvas",
  "DitherSlider.tsx": "canvas",
  "DitherSpinner.tsx": "canvas",
  "DitherSwitch.tsx": "canvas",
  "DitherTabs.tsx": "canvas: the marker painted (its slide is a CSS transition)",
  "DitherToaster.tsx": "canvas: the rail painted once laid out",
  "DitherToggle.tsx": "canvas",
  "DitherToggleGroup.tsx": "canvas",
  "GhostCursor.tsx": "canvas trail behind the pointer",
  "ImageTrail.tsx": "canvas trail behind the pointer",
  "PixelTrail.tsx": "canvas trail behind the pointer",
  "SplashCursor.tsx": "canvas fluid under the pointer",
  "ScrollProgress.tsx": "canvas: the dithered bar printed at the scroll",
  "runtime/chart-context.ts": "canvas: the charts",
  "runtime/polar-context.ts": "canvas: the charts",
  "runtime/kit-time.ts": "the kit clock's moment for a canvas that changes on a cadence",
  // the dither over DOM, and the scene clock its painters read
  "DitherReveal.tsx": "the wipe's dithered mask, a mask a moment",
  "DitherStage.tsx": "the scene clock its painters and keyframed layers read",
  // the product is the pointer, followed
  "BlobCursor.tsx": "pointer: blobs follow it",
  "TextCursor.tsx": "pointer: a trail of text follows it",
  "TextPressure.tsx": "pointer: the type weighs by its distance",
  "VariableProximity.tsx": "pointer: the type weighs by its distance",
  // a frame that moves nothing
  "CodeInput.tsx": "a frame to put the caret back",
  "MentionInput.tsx": "a frame to put the caret back",
  "RelativeTime.tsx": "reads the time again each minute",
  "runtime/presence.tsx": "one frame between a transition's from and to classes",
  // left for the user's decision: text riding an SVG curve is textPath's
  // startOffset, which CSS cannot animate
  "CurvedLoop.tsx": "decision: a curved marquee CSS cannot drive",
}

const files = (dir: URL, prefix = ""): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(new URL(`${e.name}/`, dir), `${prefix}${e.name}/`)
      : /\.tsx?$/.test(e.name)
        ? [`${prefix}${e.name}`]
        : [],
  )

describe("the kit's UI motion", () => {
  it("is CSS: only the listed pieces run frames in JS", () => {
    const driving = files(SOLID).filter((f) => DRIVES.test(readFileSync(new URL(f, SOLID), "utf8")))
    expect(driving.filter((f) => !(f in STILL_JS))).toEqual([])
  })

  it("lists only files that stand", () => {
    expect(Object.keys(STILL_JS).filter((f) => !existsSync(new URL(f, SOLID)))).toEqual([])
  })

  it("names every keyframe dk-*, so the kit clock holds it", () => {
    const named = files(SOLID)
      .map((f) => f.replace(/\.tsx?$/, ".css"))
      .filter((f) => existsSync(new URL(f, SOLID)))
      .flatMap((f) => [...readFileSync(new URL(f, SOLID), "utf8").matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]))
    // the container's two are the docs' demo of a stylesheet that reads it
    expect(named.filter((n) => !/^dk-/.test(n!) && !/^dither-cq-/.test(n!))).toEqual([])
  })
})
