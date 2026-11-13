// @vitest-environment node
// The post-build's pure parts (`scripts/postbuild.mjs`): the Chromium it
// draws with, the server it draws from, the renderer page it builds, what a
// section's embed says, the cards' cache marker, the registry's file, and
// the kit's standalone stylesheet (the earlier Vue site's `tests/kit-css.spec.ts`,
// held here for the Solid layer). The browser's parts are held by the build
// itself, which fails when a card or the registry does.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"
import { ROUTE_CARDS, componentEmbed, sectionCard, sectionsManifest } from "@/pages/docs/crawler-files"
import { SECTIONS } from "@/pages/docs/groups"
import {
  type CardPage,
  cardsHash,
  embedLine,
  findChromium,
  listen,
  refinedEmbed,
  renderOgCards,
  servedFile,
  writeAgentRegistry,
} from "../../../scripts/cards"
import { buildKitCss } from "../../../scripts/kit-css.mjs"
import { ogPage } from "../../scripts/og-page"

const root = new URL("../../..", import.meta.url).pathname
const read = (path: string) => readFileSync(join(root, path), "utf8")
const scratch = mkdtempSync(join(tmpdir(), "cards-"))

describe("the build's browser", () => {
  it("is CHROME_PATH first, then a standard install", () => {
    expect(findChromium({ CHROME_PATH: "/opt/chrome" }, (p) => p === "/opt/chrome" || p === "/usr/bin/chromium")).toBe(
      "/opt/chrome",
    )
    expect(findChromium({}, (p) => p === "/usr/bin/chromium")).toBe("/usr/bin/chromium")
    expect(findChromium({ CHROME_PATH: "/gone" }, (p) => p === "/usr/bin/google-chrome")).toBe("/usr/bin/google-chrome")
  })

  it("fails loudly when there is none: the build stops rather than ship without its cards", () => {
    expect(() => findChromium({}, () => false)).toThrow(/no chromium found/)
  })

  it("runs the post-build after the pages, and that script stops before drawing without a browser", () => {
    const pkg = JSON.parse(read("solid-site/package.json"))
    expect(pkg.scripts.build).toBe("vite build && node scripts/postbuild.mjs")
    const script = read("solid-site/scripts/postbuild.mjs")
    expect(script.indexOf("findChromium()")).toBeGreaterThan(0)
    expect(script.indexOf("findChromium()")).toBeLessThan(script.indexOf("buildKitCss()"))
    // Nothing swallows a failure: the one `try` only closes what it opened.
    expect(script).not.toMatch(/catch\s*[({]/)
  })
})

describe("the server the cards are drawn from", () => {
  const dir = join(scratch, "served")
  mkdirSync(join(dir, "og"), { recursive: true })
  writeFileSync(join(dir, "index.html"), "home")
  writeFileSync(join(dir, "og", "index.html"), "renderer")
  writeFileSync(join(dir, "og", "sections.json"), "[]")
  const servers: { close: () => void }[] = []
  afterAll(() => servers.forEach((s) => s.close()))

  it("names a file inside the build for every address, the deploy's base taken off", () => {
    expect(servedFile(dir, "/")).toBe(join(dir, "index.html"))
    expect(servedFile(dir, "/og/a.png?x=1")).toBe(join(dir, "og", "a.png"))
    expect(servedFile(dir, "/%2e%2e/%2e%2e/etc/passwd")).toBe(join(dir, "etc", "passwd"))
    expect(servedFile(dir, "/dither-ui/og/a.png", "/dither-ui/")).toBe(join(dir, "og", "a.png"))
    expect(servedFile(dir, "/og/a.png", "/dither-ui/")).toBeNull()
  })

  it("serves files and folders with their types, and 404s the rest", async () => {
    const server = await listen(dir)
    servers.push(server)
    const home = await fetch(`${server.origin}/`)
    expect([home.status, await home.text()]).toEqual([200, "home"])
    const page = await fetch(`${server.origin}/og/`)
    expect([page.headers.get("content-type"), await page.text()]).toEqual(["text/html", "renderer"])
    expect((await fetch(`${server.origin}/og/sections.json`)).headers.get("content-type")).toBe("application/json")
    expect((await fetch(`${server.origin}/og/none.png`)).status).toBe(404)
  })

  it("serves a project deploy under its base only", async () => {
    const server = await listen(dir, "/dither-ui/")
    servers.push(server)
    expect((await fetch(`${server.origin}/dither-ui/og/index.html`)).status).toBe(200)
    expect((await fetch(`${server.origin}/og/index.html`)).status).toBe(404)
  })
})

describe("the renderer page", () => {
  const shell = read("solid-site/scripts/og-shell.html")

  it("is one shell and one framework-free script: one canvas, noindex, loading until its cards are", () => {
    expect(shell).toContain('<canvas id="og" width="1200" height="630">')
    expect(shell).toContain('<meta name="robots" content="noindex" />')
    expect(shell).toContain("<title>og-loading</title>")
    const builder = read("solid-site/scripts/og-page.ts")
    expect(builder).toContain("./og-shell.html")
    expect(builder).toContain("../../src/pages/docs/og-page.ts")
  })

  it("is framework free, so the Solid build takes it as it is", () => {
    for (const file of ["og-page.ts", "og-card.ts", "og-art.ts"])
      expect(read(`src/pages/docs/${file}`)).not.toMatch(/from "(vue|solid-js)[/"]|\.vue"/)
  })

  it("loads the build's stylesheet and script from its own folder, whatever the base", () => {
    const html = ogPage(shell, { scripts: ["assets/og-page-abc.js"], styles: ["assets/og-page-abc.css"] })
    expect(html).toContain('<link rel="stylesheet" crossorigin href="./assets/og-page-abc.css" />')
    expect(html).toContain('<script type="module" crossorigin src="./assets/og-page-abc.js"></script>')
    expect(html.indexOf("og-page-abc.js")).toBeLessThan(html.indexOf("</head>"))
    expect(html.match(/<\/head>/g)).toHaveLength(1)
    expect(html.replace(/\s*<(link rel="stylesheet"|script)[^\n]*\n/g, "\n").replace(/\s+/g, "")).toBe(
      shell.replace(/\s+/g, ""),
    )
  })

  it("refuses a shell with no head or a build with no script", () => {
    expect(() => ogPage("<body></body>", { scripts: ["a.js"], styles: [] })).toThrow(/no head/)
    expect(() => ogPage(shell, { scripts: [], styles: [] })).toThrow(/no script/)
  })
})

describe("a section's embed", () => {
  const section = JSON.parse(sectionsManifest()).find((s: { id: string }) => s.id === "avatar")
  const embed = componentEmbed(sectionCard("avatar"))

  it("cuts its lede at a sentence within 280 characters, keeping a long first sentence whole", () => {
    expect(embedLine("One. Two! Three?")).toBe("One. Two! Three?")
    const long = `${"a".repeat(200)}. ${"b".repeat(100)}. Tail.`
    expect(embedLine(long)).toBe(`${"a".repeat(200)}.`)
    expect(embedLine(`${"a".repeat(400)}. Next.`)).toBe(`${"a".repeat(400)}.`)
    expect(embedLine("no full stop")).toBe("no full stop")
  })

  it("says the section's lede in place of the meta description it was built with", () => {
    const out = refinedEmbed(embed, section, "A face from a seed. Second sentence.")!
    expect(out).toContain("A face from a seed. Second sentence.")
    expect(out).not.toContain(section.description)
    expect(Buffer.byteLength(out)).toBeLessThanOrEqual(3000)
    // Everything but that line is the embed as built.
    expect(JSON.parse(out).component.components.slice(1)).toEqual(JSON.parse(embed).component.components.slice(1))
  })

  it("leaves an embed alone with no lede, once refined, when missing, or past Discord's cap", () => {
    expect(refinedEmbed(embed, section, "")).toBeNull()
    const once = refinedEmbed(embed, section, "A face from a seed.")!
    expect(refinedEmbed(once, section, "Another line.")).toBeNull()
    expect(refinedEmbed("null", section, "A line.")).toBeNull()
    expect(refinedEmbed(embed, section, `${"a".repeat(3000)}.`)).toBeNull()
  })
})

describe("the cards on disk", () => {
  const bytes = (s: string) => new TextEncoder().encode(s)

  it("are current only for the same renderer, manifest and ledes", () => {
    const hash = cardsHash(bytes("page"), bytes("[]"), { a: "one" })
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
    expect(cardsHash(bytes("page"), bytes("[]"), { a: "one" })).toBe(hash)
    expect(cardsHash(bytes("page2"), bytes("[]"), { a: "one" })).not.toBe(hash)
    expect(cardsHash(bytes("page"), bytes("[1]"), { a: "one" })).not.toBe(hash)
    expect(cardsHash(bytes("page"), bytes("[]"), { a: "two" })).not.toBe(hash)
  })

  it("has a card for each route and each section, no id shared", () => {
    const ids = [...ROUTE_CARDS.map((r) => r.id), ...SECTIONS.map((s) => s.id)]
    expect(ROUTE_CARDS.map((r) => r.id)).toEqual(["home", "docs", "studio"])
    expect(new Set(ids).size).toBe(ids.length)
    expect(JSON.parse(sectionsManifest()).map((s: { id: string }) => s.id)).toEqual(SECTIONS.map((s) => s.id))
  })

  // A stand-in for the renderer page: what `window.og` answers.
  const png = Buffer.from("png").toString("base64")
  const gif = Buffer.from("gif").toString("base64")
  const pageOf = (title: string, files: (id: string) => { png: string; gif: string }): CardPage => ({
    goto: async () => {},
    waitForFunction: async () => {},
    waitForSelector: async () => {},
    title: async () => title,
    close: async () => {},
    evaluate: (async (_fn: unknown, id?: string) => (id === undefined ? ["home", "avatar"] : files(id))) as never,
  })
  const distOf = (name: string) => {
    const dist = join(scratch, name)
    mkdirSync(join(dist, "og"), { recursive: true })
    writeFileSync(join(dist, "og", "index.html"), "renderer")
    writeFileSync(join(dist, "og", "sections.json"), "[]")
    return dist
  }
  const quiet = { origin: "http://x", ledes: { avatar: "A face." }, log: () => {} }

  it("writes each card's still and loop and the ledes the renderer reads, then skips while they are current", async () => {
    const dist = distOf("drawn")
    const browser = { newPage: async () => pageOf("og-ready", () => ({ png, gif })) }
    expect(await renderOgCards({ browser, dist, ...quiet })).toBe(2)
    for (const id of ["home", "avatar"]) {
      expect(readFileSync(join(dist, "og", `${id}.png`), "utf8")).toBe("png")
      expect(readFileSync(join(dist, "og", `${id}.gif`), "utf8")).toBe("gif")
    }
    expect(JSON.parse(readFileSync(join(dist, "og", "ledes.json"), "utf8"))).toEqual({ avatar: "A face." })
    expect(await renderOgCards({ browser, dist, ...quiet })).toBe(0)
    expect(await renderOgCards({ browser, dist, ...quiet, ledes: { avatar: "Another." } })).toBe(2)
  })

  it("fails the build when the renderer does not load, a card throws or a card comes out empty", async () => {
    const down = { newPage: async () => pageOf("og-error", () => ({ png, gif })) }
    await expect(renderOgCards({ browser: down, dist: distOf("down"), ...quiet })).rejects.toThrow(/failed to load/)
    const throwing = {
      newPage: async () =>
        pageOf("og-ready", () => {
          throw new Error("canvas lost")
        }),
    }
    await expect(renderOgCards({ browser: throwing, dist: distOf("thrown"), ...quiet })).rejects.toThrow(/canvas lost/)
    const empty = { newPage: async () => pageOf("og-ready", () => ({ png, gif: "" })) }
    await expect(renderOgCards({ browser: empty, dist: distOf("empty"), ...quiet })).rejects.toThrow(/came out empty/)
  })

  it("draws nothing without a renderer page", async () => {
    const dist = join(scratch, "bare")
    mkdirSync(dist, { recursive: true })
    const browser = { newPage: async () => pageOf("og-ready", () => ({ png, gif })) }
    expect(await renderOgCards({ browser, dist, ...quiet })).toBe(0)
  })
})

describe("the agent registry's file", () => {
  const page = (registry: unknown): CardPage => ({
    goto: async () => {},
    waitForFunction: async () => {},
    waitForSelector: async () => {},
    title: async () => "",
    close: async () => {},
    evaluate: (async () => registry) as never,
  })

  it("is the mounted Studio's own registry, as it answers it", async () => {
    const dist = join(scratch, "registry")
    const registry = { version: 1, components: [{ is: "DitherButton" }, { is: "DitherBadge" }] }
    expect(await writeAgentRegistry(page(registry), dist)).toBe(2)
    expect(readFileSync(join(dist, "agent", "registry.json"), "utf8")).toBe(JSON.stringify(registry, null, 2))
  })

  it("writes nothing when the page exposes no Studio, which the build takes as a failure", async () => {
    expect(await writeAgentRegistry(page(null), join(scratch, "none"))).toBe(0)
    expect(read("solid-site/scripts/postbuild.mjs")).toMatch(/if \(!components\) throw new Error/)
  })

  it("is left to the post-build by the crawl, not listed as unported", () => {
    const config = read("solid-site/vite.config.ts")
    expect(config).toMatch(/MADE_AFTER_THE_PAGES = \["\/agent\/registry\.json"\]/)
    expect(config).not.toMatch(/NOT_YET_PORTED[^\n]*registry/)
  })
})

// Compiles the kit's stylesheet with Tailwind's own compiler: integration-scale budget.
describe("the kit's standalone stylesheet", () => {
  it("scans the Solid layer and the chart cores beside the other bindings", () => {
    const entry = read("dither-kit/tailwind/kit.css")
    expect(entry).toContain('@source "./";')
    expect(entry).toContain('@source "../solid/";')
  })

  it(
    "carries the tokens, the scoped base and the kit's utilities, and nothing global",
    { timeout: 60000 },
    async () => {
      const css: string = await buildKitCss({ minify: false })
      expect(css).toContain("--background:")
      expect(css).toContain("--swatch-blue:")
      expect(css).toMatch(/\.dark\s*\{/)
      expect(css).toContain(":where(.dither-kit")
      expect(css).toContain(".text-muted-foreground")
      expect(css).toContain(".border-border")
      expect(css).toContain(".rounded-md")
      expect(css).toMatch(/@layer dither-kit\.utilities/)
      // Every element rule is scoped: no bare html / body / button selectors.
      expect(css).not.toMatch(/(^|\}|\n)\s*(html|body|button|input)\s*[{,]/)
      expect(css.length).toBeLessThan(600_000)
      // A class only the Solid layer's own files spell (its `classList` keys).
      const solid = readFileSync(join(root, "dither-kit/solid/DitherButton.tsx"), "utf8")
      const classes = [...solid.matchAll(/"([a-z][a-z0-9-]*(?:-[a-z0-9]+)+)"/g)].map((m) => m[1])
      expect(classes.some((c) => css.includes(`.${c}`))).toBe(true)
    },
  )
})
