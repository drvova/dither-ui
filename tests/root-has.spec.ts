// No stylesheet keys the root on `:has()`. A `:root:has(.landing)` rule made
// the browser re-match the root on every node added or removed anywhere on
// the page, and since the root carries the page's tokens, each match
// restyled the whole document: about 2,000 elements, dozens of times a
// scroll (measured, 1.3s of 1.6s of style work). The pages mark the root
// with their route instead (`data-page`), which the grounds key on.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { ROUTE_TITLES } from "@/shared/config/titles"

const root = new URL("..", import.meta.url).pathname
const SOURCES = ["src", "solid-site/src", "dither-kit"]
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    if (entry === "node_modules" || entry.startsWith(".")) return []
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? files(path) : entry.endsWith(".css") ? [path] : []
  })
const read = (path: string) => readFileSync(join(root, path), "utf8")

describe("the root's style", () => {
  it("is never keyed on :has()", () => {
    const hits = SOURCES.flatMap((dir) => files(join(root, dir))).flatMap((path) =>
      [...readFileSync(path, "utf8").matchAll(/(?:^|[\s,}])((?::root|html|body)[^{,;]*:has\()/gm)].map(
        (m) => `${path.slice(root.length)}: ${m[1]}`,
      ),
    )
    expect(hits).toEqual([])
  })

  it("is marked with the page by the app, in the routes' own names", () => {
    expect(read("solid-site/src/entry-server.tsx")).toContain(
      '<html lang="en" class="dark" data-page={page ?? undefined}>',
    )
    // every page a stylesheet keys on is a route the app marks
    const keyed = SOURCES.flatMap((dir) => files(join(root, dir))).flatMap((path) =>
      [...readFileSync(path, "utf8").matchAll(/\[data-page="(\w+)"\]/g)].map((m) => m[1]),
    )
    expect(keyed.length).toBeGreaterThan(0)
    for (const page of keyed) expect(Object.keys(ROUTE_TITLES)).toContain(page)
  })
})
