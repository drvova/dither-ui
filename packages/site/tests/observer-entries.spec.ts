// An IntersectionObserver can hand one callback several entries for one
// element, oldest first (Chromium, a box observed at 0x0 and then sized as
// a late stylesheet lands: [out of view, in view]). A callback that reads
// only the first entry holds the old answer for good: the docs' app shell
// left its sparklines paused that way. Every observer in the kit and the
// site reads the newest (`latestEntry`, @dither-ui/kit/engine/visibility.ts)
// or walks them all; none takes the first by destructuring.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "rstack/test"

const ROOT = join(import.meta.dirname, "../../..")
const SOURCES = ["packages/site/src", "packages/dither-kit/src"]

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : []
  })

/** An observer whose callback opens by destructuring its first entry. */
const FIRST_ONLY = /IntersectionObserver\(\s*\(\s*\[/

describe("visibility observers", () => {
  it("never read only the first entry", () => {
    const first = SOURCES.flatMap((dir) => files(join(ROOT, dir)))
      .filter((path) => FIRST_ONLY.test(readFileSync(path, "utf8")))
      .map((path) => relative(ROOT, path))
    expect(first).toEqual([])
  })

  it("is a pattern that catches the form it bans", () => {
    expect(FIRST_ONLY.test("new IntersectionObserver(([entry]) => entry.isIntersecting)")).toBe(true)
    expect(FIRST_ONLY.test("new IntersectionObserver(\n  ([e]) => {")).toBe(true)
    expect(FIRST_ONLY.test("new IntersectionObserver((entries) => latestEntry(entries))")).toBe(false)
  })
})
