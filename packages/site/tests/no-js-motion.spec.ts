// No motion of the site's is a script's (the user's call: "I don't want any
// animations to be JS; I want them to be no JS and be class names"): its
// source neither runs the frame clock, nor plays the Web Animations API,
// nor writes a transform, a translate, a scale or an opacity, nor starts a
// view transition, except where a row below says why. What is left is the
// kit's dithered art (which no stylesheet can draw), the tools that draw on
// a canvas, and placements a stylesheet then moves; the site's own motion
// is its stylesheets' (`tests/css-motion.spec.ts`).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"

const root = new URL("../../..", import.meta.url).pathname
const SRC = join(root, "packages/site/src")

/** What moves a thing from a script. */
const MOTION = [
  /\brequestAnimationFrame\(/,
  /\.animate\(/,
  /\bstartViewTransition\(/,
  /\bdither(?:View)?Transition\(/,
  /\bgetAnimations\(/,
  /\.style\.(?:transform|translate|scale|opacity)\s*=/,
  /\bsetProperty\(\s*["'](?:transform|translate|scale|opacity)["']/,
  /\b(?:transform|translate|scale|opacity):\s*`/,
]

/** Where a script still does, and why. Paths from `src/`; a folder ends in `/`. */
const ALLOWED: Record<string, string> = {
  // the kit's art and its drivers: dither is drawn cell by cell, never by a stylesheet
  "pages/landing/BrandGather.tsx":
    "the brand's cells, each on its own path choreographed from the field it is laid out in, stepped whole cells",
  "pages/landing/BrandBuild.tsx": "drives the kit's world (a canvas) from the scroll, read in the frame",
  "pages/docs/components/MediaDocs.tsx": "the rocket demo's clock, which drives the kit's world (a canvas)",
  "pages/docs/components/SurfaceDocs.tsx": "the frame meter demo: it reads the frame clock and moves nothing",
  "pages/docs/animations/TransitionSection.tsx": "the docs' demo of the kit's own transition engine, its API",
  "pages/docs/": "a docs example: the code a reader copies, the kit's API at work",
  "widgets/frame-renderer/ReelRenderer.tsx": "a reel's clips played on the kit clock: the Studio's film",
  "widgets/frame-renderer/ReelClip.tsx": "a clip's camera on the kit clock: the Studio's film",
  // tools that draw on a canvas or read what moves
  "widgets/workbench/model/measuring.ts": "the inspect tools' overlays, drawn on a canvas each frame they are open",
  "widgets/workbench/model/recorder.ts": "waits for the preview's frames to paint before it captures them",
  "widgets/workbench/model/capture.ts": "records a preview into a canvas, frame by frame",
  "widgets/workbench/ui/Loupe.tsx": "the loupe's magnified canvas",
  "widgets/workbench/ui/Motion.tsx": "the motion inspector lists the page's animations; it plays none",
  "widgets/source/SourcePanel.tsx": "waits a frame to measure its tabs and to reveal an editor's line; moves nothing",
  // placements under the hand, or a stylesheet's travel
  "widgets/canvas/Canvas.tsx": "the canvas's pan and zoom, where the reader's hand put it",
  "widgets/workbench/ui/Responsive.tsx": "a preview scaled to fit its frame",
  "pages/studio/ui/StudioGuide.tsx": "places the tour by the part it explains; its travel is its CSS transition",
  // the one transition a control starts, its motion all the stylesheet's
  "shared/lib/useTheme.ts":
    "the theme toggle starts the one typed view transition (a whole page cannot transition its theme in CSS alone)",
}

function* sources(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* sources(path)
    else if (/\.tsx?$/.test(name)) yield path
  }
}

const allowed = (file: string) =>
  Object.keys(ALLOWED).some((k) => (k.endsWith("/") ? file.startsWith(k) && /\/examples\//.test(file) : file === k))

describe("the site's motion", () => {
  it("is never a script's, but for the rows that say why", () => {
    const off: string[] = []
    for (const path of sources(SRC)) {
      const file = path.slice(SRC.length + 1)
      if (allowed(file)) continue
      readFileSync(path, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.trim().startsWith("//") || line.trim().startsWith("*")) return
          if (MOTION.some((m) => m.test(line))) off.push(`${file}:${i + 1}: ${line.trim()}`)
        })
    }
    expect(off).toEqual([])
  })

  it("keeps no row that no longer moves anything", () => {
    const stale = Object.keys(ALLOWED).filter((k) => {
      if (k.endsWith("/")) return false
      const text = readFileSync(join(SRC, k), "utf8")
      return !MOTION.some((m) => m.test(text))
    })
    expect(stale).toEqual([])
  })

  it("installs no press, rise, glide, scene or page hand-off", () => {
    const client = readFileSync(join(SRC, "entry-client.tsx"), "utf8")
    const shell = readFileSync(join(SRC, "entry-server.tsx"), "utf8")
    for (const text of [client, shell])
      expect(text).not.toMatch(
        /installPress|RISE_HEAD_SCRIPT|PAGE_REVEAL_SCRIPT|takePageTransition|lib\/(press|rise|glide)/,
      )
    for (const file of [
      "shared/lib/press.ts",
      "shared/lib/rise.ts",
      "shared/lib/glide.ts",
      "shared/lib/scroll-scene.ts",
      "widgets/site-header/sheet.ts",
    ])
      expect(() => statSync(join(SRC, file)), file).toThrow()
  })
})
