// The add command as a reader runs it: the real script, spawned in a scratch
// project against a scratch site (a manifest and its files in a folder, as
// `--from` reads a built site). Each command, the index it writes, the
// settings it keeps, and the guard: a file the reader changed is never
// replaced without `--force`, the run shows the difference and writes
// nothing. The site's own manifest is held by `packages/site/tests/kit-add.spec.ts`.
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { afterAll, describe, expect, it } from "rstack/test"

const SCRIPT = resolve("packages/add/src/dither-add.mjs")
const scratch = mkdtempSync(join(tmpdir(), "dither-add-"))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

const sha = (text: string) => createHash("sha256").update(text).digest("hex")
const put = (path: string, text: string) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
}

/** A site with two components that share an engine file, in two layers. */
const FILES: Record<string, string> = {
  "engine/api.ts": "export const KIT = 1\n",
  "engine/pixel.ts": 'import { clsx } from "clsx"\nexport const px = clsx\n',
  "engine/theme.css": ":root { --ink: #000; }\n",
  "solid/Button.tsx": 'import { px } from "../engine/pixel"\nexport default function Button() {\n  return px\n}\n',
  "solid/Card.tsx":
    'import "./Card.css"\nimport { px } from "../engine/pixel"\nexport default function Card() {\n  return px\n}\n',
  "solid/Card.css": ".dk-card { color: red; }\n",
  "stylex/Button.tsx":
    'import * as stylex from "@stylexjs/stylex"\nexport default function Button() {\n  return stylex\n}\n',
  "tailwind/kit.css": '@import "../engine/theme.css";\n',
  "dither-kit.css": ".dither-kit { color: black; }\n",
}
const PACKAGES: Record<string, string[]> = { "engine/pixel.ts": ["clsx"], "stylex/Button.tsx": ["@stylexjs/stylex"] }
const SITE = join(scratch, "site")
const manifest = {
  version: "test",
  stylings: {
    tailwind: {
      layer: "solid",
      base: ["engine/api.ts", "tailwind/kit.css", "engine/theme.css"],
      sheets: ["tailwind/kit.css"],
    },
    css: { layer: "solid", base: ["engine/api.ts", "dither-kit.css"], sheets: ["dither-kit.css"] },
    modules: { layer: "solid", base: ["engine/api.ts", "dither-kit.css"], sheets: ["dither-kit.css"] },
    stylex: { layer: "stylex", base: ["engine/api.ts", "engine/theme.css"], sheets: ["engine/theme.css"] },
  },
  files: Object.fromEntries(
    Object.entries(FILES).map(([path, text]) => [
      path,
      { src: `kit/${path}`, hash: sha(text), imports: [], packages: PACKAGES[path] ?? [] },
    ]),
  ),
  index: {
    solid: {
      path: "solid/index.ts",
      statements: [
        { file: "engine/api.ts", text: 'export * from "../engine/api"' },
        { file: "solid/Button.tsx", text: 'export { default as DitherButton } from "./Button"' },
        { file: "solid/Card.tsx", text: 'export { default as DitherCard } from "./Card"' },
      ],
    },
    stylex: {
      path: "stylex/index.ts",
      statements: [
        { file: "engine/api.ts", text: 'export * from "../engine/api"' },
        { file: "stylex/Button.tsx", text: 'export { default as DitherButton } from "./Button"' },
      ],
    },
  },
  components: {
    DitherButton: { solid: ["engine/pixel.ts", "solid/Button.tsx"], stylex: ["stylex/Button.tsx"] },
    DitherCard: { solid: ["engine/pixel.ts", "solid/Card.css", "solid/Card.tsx"] },
  },
}
put(join(SITE, "add/manifest.json"), JSON.stringify(manifest))
for (const [path, text] of Object.entries(FILES)) put(join(SITE, "kit", path), text)

let projects = 0
/** A new project: a package.json and nothing else. */
function project(): string {
  const dir = join(scratch, `project-${++projects}`)
  put(join(dir, "package.json"), JSON.stringify({ name: "app", dependencies: { "solid-js": "1" } }))
  return dir
}
function run(cwd: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" })
  return { status: r.status, out: r.stdout, err: r.stderr }
}
const kit = (cwd: string, path: string) => join(cwd, "src/dither-kit", path)
const text = (path: string) => readFileSync(path, "utf8")

describe("add", () => {
  it("writes the component, every file it needs and an index of just what was added", () => {
    const cwd = project()
    const r = run(cwd, "add", "button", "--from", SITE)
    expect(r.status, r.err).toBe(0)
    for (const f of ["engine/api.ts", "engine/pixel.ts", "solid/Button.tsx", "tailwind/kit.css", "engine/theme.css"])
      expect(text(kit(cwd, f)), f).toBe(FILES[f])
    expect(existsSync(kit(cwd, "solid/Card.tsx"))).toBe(false)
    const index = text(kit(cwd, "solid/index.ts"))
    expect(index).toContain('export { default as DitherButton } from "./Button"')
    expect(index).toContain('export * from "../engine/api"')
    expect(index).not.toContain("DitherCard")
    // the one alias, the stylesheet and the packages the project lacks
    expect(r.out).toContain("Point @dither-kit at src/dither-kit/solid")
    expect(r.out).toContain('@import "./src/dither-kit/tailwind/kit.css";')
    expect(r.out).toContain("npm i clsx")
    expect(r.out).toContain('import { DitherButton } from "@dither-kit"')
    // the settings, written once, and the record of what was written
    expect(JSON.parse(text(join(cwd, "dither-kit.json")))).toEqual({
      dir: "src/dither-kit",
      styling: "tailwind",
      from: SITE,
    })
    const lock = JSON.parse(text(kit(cwd, ".dither-add.json")))
    expect(lock.components).toEqual(["DitherButton"])
    expect(lock.files["solid/Button.tsx"]).toBe(sha(FILES["solid/Button.tsx"]))
  })

  it("adds to what is there, from the settings it kept, and rewrites the index", () => {
    const cwd = project()
    run(cwd, "add", "DitherButton", "--from", SITE)
    const r = run(cwd, "add", "DitherCard")
    expect(r.status, r.err).toBe(0)
    expect(text(kit(cwd, "solid/Card.css"))).toBe(FILES["solid/Card.css"])
    const index = text(kit(cwd, "solid/index.ts"))
    expect(index).toContain("DitherButton")
    expect(index).toContain("DitherCard")
    expect(JSON.parse(text(kit(cwd, ".dither-add.json"))).components).toEqual(["DitherButton", "DitherCard"])
  })

  it("takes the styling system's files: the stylesheet for css and modules, the twin for stylex", () => {
    const css = project()
    expect(run(css, "add", "DitherButton", "--styling", "css", "--from", SITE).status).toBe(0)
    expect(text(kit(css, "dither-kit.css"))).toBe(FILES["dither-kit.css"])
    expect(existsSync(kit(css, "tailwind/kit.css"))).toBe(false)
    const stylex = project()
    const r = run(stylex, "add", "DitherButton", "--styling", "stylex", "--from", SITE)
    expect(r.status, r.err).toBe(0)
    expect(text(kit(stylex, "stylex/Button.tsx"))).toBe(FILES["stylex/Button.tsx"])
    expect(existsSync(kit(stylex, "solid/Button.tsx"))).toBe(false)
    expect(text(kit(stylex, "stylex/index.ts"))).toContain("DitherButton")
    expect(r.out).toContain("Point @dither-kit at src/dither-kit/stylex")
    expect(r.out).toContain("npm i @stylexjs/stylex")
    // one copy, one styling system
    const other = run(stylex, "add", "DitherButton", "--styling", "css", "--from", SITE)
    expect(other.status).toBe(1)
    expect(other.err).toContain("holds the stylex kit")
    // a component the layer does not have says so
    expect(run(stylex, "add", "DitherCard").err).toContain("DitherCard has no stylex version")
  })

  it("names what it does not know, and what a name could be", () => {
    const cwd = project()
    const r = run(cwd, "add", "Buton", "--from", SITE)
    expect(r.status).toBe(1)
    expect(r.err).toContain("no component Buton")
    expect(run(cwd, "add", "--from", SITE).err).toContain("add needs a component")
    expect(run(cwd, "add", "button", "--styling", "sass", "--from", SITE).err).toContain("--styling takes")
  })
})

describe("the guard", () => {
  it("never replaces a file the reader changed: it shows the difference and writes nothing", () => {
    const cwd = project()
    run(cwd, "add", "DitherButton", "--from", SITE)
    const mine = FILES["engine/pixel.ts"].replace("clsx\n", "clsx // mine\n")
    writeFileSync(kit(cwd, "engine/pixel.ts"), mine)
    const r = run(cwd, "add", "DitherCard")
    expect(r.status).toBe(1)
    expect(r.out).toContain("--- src/dither-kit/engine/pixel.ts (yours)")
    expect(r.out).toContain("-export const px = clsx // mine")
    expect(r.out).toContain("+export const px = clsx")
    expect(r.out).toContain("Nothing was written")
    expect(text(kit(cwd, "engine/pixel.ts"))).toBe(mine)
    expect(existsSync(kit(cwd, "solid/Card.tsx"))).toBe(false)
    expect(text(kit(cwd, "solid/index.ts"))).not.toContain("DitherCard")
    // --force replaces it
    const forced = run(cwd, "add", "DitherCard", "--force")
    expect(forced.status, forced.err).toBe(0)
    expect(text(kit(cwd, "engine/pixel.ts"))).toBe(FILES["engine/pixel.ts"])
    expect(existsSync(kit(cwd, "solid/Card.tsx"))).toBe(true)
  })

  it("updates a file the reader left as it was written", () => {
    const cwd = project()
    run(cwd, "add", "DitherButton", "--from", SITE)
    // the site's copy moves on; the reader's is as written: the next add updates it
    const lock = JSON.parse(text(kit(cwd, ".dither-add.json")))
    const old = "export const KIT = 0\n"
    writeFileSync(kit(cwd, "engine/api.ts"), old)
    lock.files["engine/api.ts"] = sha(old)
    writeFileSync(kit(cwd, ".dither-add.json"), JSON.stringify(lock))
    const r = run(cwd, "add", "DitherButton")
    expect(r.status, r.err).toBe(0)
    expect(r.out).toContain("1 updated")
    expect(text(kit(cwd, "engine/api.ts"))).toBe(FILES["engine/api.ts"])
  })

  it("refuses a file that does not match the manifest", () => {
    const cwd = project()
    const site = join(scratch, "torn")
    put(join(site, "add/manifest.json"), JSON.stringify(manifest))
    for (const [path, body] of Object.entries(FILES))
      put(join(site, "kit", path), path === "engine/pixel.ts" ? "torn" : body)
    const r = run(cwd, "add", "DitherButton", "--from", site)
    expect(r.status).toBe(1)
    expect(r.err).toContain("does not match the manifest")
    expect(existsSync(kit(cwd, "solid/Button.tsx"))).toBe(false)
  })
})

describe("--dry-run", () => {
  it("says what each file would do and writes nothing", () => {
    const cwd = project()
    run(cwd, "add", "DitherButton", "--from", SITE)
    writeFileSync(kit(cwd, "engine/pixel.ts"), "mine\n")
    const r = run(cwd, "add", "DitherCard", "--dry-run")
    expect(r.status, r.err).toBe(0)
    expect(r.out).toContain("Dry run: nothing is written.")
    expect(r.out).toMatch(/add {5}src\/dither-kit\/solid\/Card\.tsx/)
    expect(r.out).toMatch(/same {4}src\/dither-kit\/solid\/Button\.tsx/)
    expect(r.out).toMatch(/update {2}src\/dither-kit\/solid\/index\.ts/)
    expect(r.out).toMatch(/keep {4}src\/dither-kit\/engine\/pixel\.ts/)
    expect(r.out).toContain("would stop the run")
    expect(existsSync(kit(cwd, "solid/Card.tsx"))).toBe(false)
    expect(text(kit(cwd, "engine/pixel.ts"))).toBe("mine\n")
    // nothing at all on a first run
    const fresh = project()
    expect(run(fresh, "add", "DitherButton", "--dry-run", "--from", SITE).status).toBe(0)
    expect(existsSync(join(fresh, "src"))).toBe(false)
    expect(existsSync(join(fresh, "dither-kit.json"))).toBe(false)
  })
})

describe("diff and list", () => {
  it("diff shows what differs between the copy and the site", () => {
    const cwd = project()
    run(cwd, "add", "DitherButton", "--from", SITE)
    expect(run(cwd, "diff", "DitherButton").out).toContain("is the site's")
    writeFileSync(kit(cwd, "solid/Button.tsx"), FILES["solid/Button.tsx"].replace("return px", "return px + 1"))
    const r = run(cwd, "diff")
    expect(r.status).toBe(1)
    expect(r.out).toContain("@@ -1,4 +1,4 @@")
    expect(r.out).toContain("-  return px + 1")
    expect(r.out).toContain("+  return px")
    expect(r.out).toContain("1 of the files differ")
  })

  it("list names every component of the styling system, the added ones marked", () => {
    const cwd = project()
    run(cwd, "add", "DitherCard", "--from", SITE)
    const r = run(cwd, "list")
    expect(r.out.split("\n").slice(0, 2)).toEqual(["DitherButton", "DitherCard (added)"])
    expect(run(cwd, "list", "--styling", "stylex", "--dir", "elsewhere").out.split("\n")[0]).toBe("DitherButton")
  })
})
