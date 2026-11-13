// What the build writes beside the pages and what each page's head says:
// the crawler files, the share cards' embeds and the install surface the
// `siteFiles` plugin emits, the one head table (held tag for tag to the Vue
// site's HTML entries until the cutover), the shell every page is rendered
// into, the root's `data-page` marker and the old hash links. Carried from
// the Vue site's `tests/crawler-files.spec.ts`, `tests/install.spec.ts`,
// `tests/titles.spec.ts` and `tests/first-paint.spec.ts`; the builders'
// own rules stay pinned there.
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { MetaProvider } from "@solidjs/meta"
import { cleanup, render } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, describe, expect, it } from "vitest"
import { APP_HEAD, ICON_HEAD, ICONS, MANIFEST, installFiles, webManifest } from "@/app/install-files"
import { OFFLINE } from "@/app/offline"
import { PAGE_END_ID, PAGE_REVEAL_SCRIPT, speculationRules } from "@/app/page-reveal"
import { BRIDGE_FILE } from "@/features/agent/bridge-file"
import { componentEmbed, llmsTxt, oembed, robotsTxt, sectionsManifest, sitemapXml } from "@/pages/docs/crawler-files"
import { SECTIONS } from "@/pages/docs/groups"
import { docsBreadcrumb, docsMeta, SITE_URL } from "@/pages/docs/seo"
import { type HeadTag, ROUTE_CARDS, sectionTags, shareCards, shareTags, tagHtml } from "@/pages/docs/share-cards"
import { ROUTE_TITLES } from "@/shared/config/titles"
import { RISE_HEAD_SCRIPT } from "@/shared/lib/rise-wait"
import { CAPTURE_PATH } from "@/shared/ui/mascot-capture"
import { siteFileList, siteFiles } from "../../site-files"
import { BREADCRUMB_ID, pageOf, pageTags, type SitePage } from "../../src/pages/docs/heads"
import PageHead from "../../src/pages/docs/PageHead"
import { legacyAddress } from "../../src/shared/lib/legacy"

const SITE = join(__dirname, "../..")
const REPO = join(SITE, "..")
const read = (root: string, file: string) => readFileSync(join(root, file), "utf8")

/** A value with its keys in order, whatever order it was written in. */
const ordered = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(ordered)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([k, x]) => [k, ordered(x)]),
        )
      : v
/** A head tag as one comparable line; structured data by its value. */
const line = (tag: string, attrs: Record<string, string>, text = "") =>
  tag === "script"
    ? `script ${JSON.stringify(ordered(JSON.parse(text)))}`
    : `${tag} ${Object.entries(attrs)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")}${text}`
const ofTag = (t: HeadTag) => line(t.tag, "attrs" in t ? t.attrs : {}, "text" in t ? t.text : "")
/** The lines of a document's head: its title, meta, links and structured
 * data, less what `skip` matches. */
function headLines(doc: Document, skip: string): string[] {
  return [...doc.head.querySelectorAll("title, meta, link, script[type='application/ld+json']")]
    .filter((el) => !el.matches(skip))
    .map((el) =>
      line(
        el.localName,
        Object.fromEntries(
          [...el.attributes].filter((a) => a.name !== "data-sm" && a.name !== "id").map((a) => [a.name, a.value]),
        ),
        el.localName === "meta" || el.localName === "link" ? "" : (el.textContent ?? ""),
      ),
    )
}
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html")
const sorted = (lines: string[]) => [...lines].sort()

/** The Vue site's HTML entry of each page. */
const ENTRY: Record<SitePage, string> = { landing: "index.html", docs: "docs/index.html", studio: "studio/index.html" }
const PAGES = Object.keys(ENTRY) as SitePage[]

afterEach(() => {
  cleanup()
  document.head.querySelectorAll("title, meta, link, script").forEach((el) => el.remove())
  delete document.documentElement.dataset.page
})

describe("the head table", () => {
  for (const page of PAGES)
    it(`says of the ${page} what the Vue site's ${ENTRY[page]} says, tag for tag`, () => {
      // the shell's own (charset, viewport) and the route's (its theme colour) aside
      const theirs = headLines(parse(read(REPO, ENTRY[page])), "[charset], [name=viewport], [name=theme-color]")
      expect(sorted(pageTags(page).map(ofTag))).toEqual(sorted(theirs))
      expect(theirs.length).toBeGreaterThan(20)
    })

  for (const page of PAGES)
    it(`carries the ${page} title three times: the title, og and X`, () => {
      const tags = pageTags(page).map(ofTag)
      const title = ROUTE_TITLES[page]
      expect(tags).toContain(`title ${title}`)
      expect(tags).toContain(`meta content=${title} property=og:title`)
      expect(tags).toContain(`meta content=${title} name=twitter:title`)
    })

  it("keeps the copy bans in every title", () => {
    for (const title of Object.values(ROUTE_TITLES)) expect(title).not.toMatch(/[—·]/)
  })

  it("points each page's previews at its own share card", () => {
    const cards = shareCards()
    PAGES.forEach((page, i) => {
      const tags = pageTags(page).map(ofTag)
      for (const t of shareTags(cards[i])) expect(tags).toContain(ofTag(t))
      expect(tags).toContain(`link href=${ROUTE_CARDS[i].url} rel=canonical`)
    })
  })

  it("gives a docs section the head the section manifest writes, indexed, its breadcrumb by id", () => {
    const records = JSON.parse(sectionsManifest()) as { id: string; head: string }[]
    for (const id of [SECTIONS[0].id, "avatar", SECTIONS[SECTIONS.length - 1].id]) {
      const tags = pageTags("docs", id)
      const own = tags.filter((t) => !("attrs" in t) || !["author", "robots"].includes(t.attrs.name))
      expect(own.map(ofTag)).toEqual(sectionTags(id).map(ofTag))
      expect(records.find((r) => r.id === id)!.head).toBe(sectionTags(id).map(tagHtml).join("\n    "))
      expect(tags.map(ofTag)).toContain("meta content=index, follow name=robots")
      const crumb = tags.find((t) => t.tag === "script")!
      expect(crumb).toMatchObject({ attrs: { id: BREADCRUMB_ID }, text: docsBreadcrumb(id) })
      expect(tags.map(ofTag)).toContain(`meta content=${SITE_URL}/og/${id}.png property=og:image`)
      expect(tags.map(ofTag)).toContain(`link href=${docsMeta(id).url} rel=canonical`)
    }
    // an id no section has: the docs' own head
    expect(pageTags("docs", "nope")).toEqual(pageTags("docs"))
  })

  it("gives the missing page its title and nothing a crawler could index it by", () => {
    expect(pageTags("missing")).toEqual([{ tag: "title", text: ROUTE_TITLES.missing }])
  })
})

describe("a page's head, rendered", () => {
  const mount = (page: () => "landing" | "docs" | "studio" | "missing", section: () => string = () => "") =>
    render(() => (
      <MetaProvider>
        <PageHead page={page()} section={section()} />
      </MetaProvider>
    ))

  for (const page of PAGES)
    it(`puts every tag of the ${page} in the document, once`, () => {
      mount(() => page)
      expect(sorted(headLines(document, "none"))).toEqual(sorted(pageTags(page).map(ofTag)))
      expect(document.title).toBe(ROUTE_TITLES[page])
    })

  it("follows the docs from section to section, leaving nothing of the last behind", () => {
    const [section, setSection] = createSignal("avatar")
    mount(() => "docs", section)
    expect(sorted(headLines(document, "none"))).toEqual(sorted(pageTags("docs", "avatar").map(ofTag)))
    expect(document.getElementById(BREADCRUMB_ID)?.textContent).toBe(docsBreadcrumb("avatar"))
    setSection("bar")
    expect(sorted(headLines(document, "none"))).toEqual(sorted(pageTags("docs", "bar").map(ofTag)))
    setSection("")
    expect(sorted(headLines(document, "none"))).toEqual(sorted(pageTags("docs").map(ofTag)))
    expect(document.getElementById(BREADCRUMB_ID)).toBeNull()
  })

  it("keeps a `<` from opening a tag inside structured data", () => {
    mount(() => "landing")
    expect(document.head.querySelector("script[type='application/ld+json']")!.innerHTML).not.toContain("<")
  })

  it("marks the root with the page, and lets go of its own mark only", () => {
    const first = mount(() => "studio")
    expect(document.documentElement.dataset.page).toBe("studio")
    // the next page marks the root before the last one has gone
    document.documentElement.dataset.page = "docs"
    first.unmount()
    expect(document.documentElement.dataset.page).toBe("docs")
    const second = mount(() => "missing")
    expect(document.documentElement.dataset.page).toBe("missing")
    second.unmount()
    expect(document.documentElement.dataset.page).toBeUndefined()
  })
})

describe("the page an address opens on", () => {
  it("is the route the address names, a docs section only when it exists", () => {
    for (const [path, page] of [
      ["/", "landing"],
      ["/index.html", "landing"],
      ["/docs", "docs"],
      ["/docs/", "docs"],
      ["/docs/button", "docs"],
      ["/docs/button/", "docs"],
      ["/docs/button/index.html", "docs"],
      ["/studio", "studio"],
      ["/studio/", "studio"],
      ["/nowhere", "missing"],
      ["/404.html", "missing"],
      ["/docs/no-such-section", "missing"],
      ["/docs/button/more", "missing"],
      ["/studios", "missing"],
      // no page of the site: the player and the cards' renderer
      ["/play", null],
      ["/play/", null],
      ["/og/index.html", null],
    ] as const)
      expect(pageOf(path), path).toBe(page)
  })

  it("moves an old hash link on the landing's address to the page it names", () => {
    expect(legacyAddress("#/docs/avatar")).toBe("/docs/avatar")
    expect(legacyAddress("#/docs")).toBe("/docs")
    expect(legacyAddress("#/studio")).toBe("/studio")
    expect(legacyAddress("#/studio/")).toBe("/studio")
    expect(legacyAddress("#/studio/new/film")).toBe("/studio#new/film")
    for (const hash of ["", "#", "#build", "#docs", "#/play"]) expect(legacyAddress(hash), hash).toBeNull()
    // the entry applies it before the app mounts, on the landing only
    const entry = read(SITE, "src/entry-client.tsx")
    expect(entry).toMatch(/isLanding\(appPathname\(\)\) \? legacyAddress\(location\.hash\) : null/)
    expect(entry).toMatch(/if \(legacy\) location\.replace\(routePath\(legacy\)\)\s+else mount\(/)
  })
})

describe("the files the build writes beside the pages", async () => {
  const emitted: Record<string, string | Uint8Array> = {}
  const run = (environment: string, into: Record<string, string | Uint8Array>) =>
    (siteFiles().generateBundle as unknown as (this: unknown) => Promise<void>).call({
      environment: { name: environment },
      emitFile: (f: { fileName: string; source: string | Uint8Array }) => void (into[f.fileName] = f.source),
    })
  await run("client", emitted)
  const cards = shareCards()

  it("are emitted once, with the browser's assets, and are a plugin of the build", async () => {
    const server: Record<string, string | Uint8Array> = {}
    await run("ssr", server)
    expect(Object.keys(server)).toEqual([])
    expect(Object.keys(emitted).sort()).toEqual(Object.keys(await siteFileList()).sort())
    expect(read(SITE, "vite.config.ts")).toMatch(/plugins: \[[^\]]*siteFiles\(\)/)
  })

  it("are the crawler files the Vue build emits, from the same builders", () => {
    expect(emitted["sitemap.xml"]).toBe(sitemapXml())
    expect(emitted["robots.txt"]).toBe(robotsTxt())
    expect(emitted["llms.txt"]).toBe(llmsTxt())
    expect(emitted["og/sections.json"]).toBe(sectionsManifest())
  })

  it("list the three routes and every docs section once in the sitemap, each a page of this build", () => {
    const locs = [...(emitted["sitemap.xml"] as string).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/docs`,
      `${SITE_URL}/studio`,
      ...SECTIONS.map((s) => `${SITE_URL}/docs/${s.id}`),
    ])
    expect(new Set(locs).size).toBe(locs.length)
    // every address is one the routes answer with a page, never the missing one
    for (const loc of locs) expect(pageOf(new URL(loc).pathname), loc).not.toBe("missing")
  })

  it("allow every crawler, keep only the cards' renderer from them and name the sitemap", () => {
    const robots = emitted["robots.txt"] as string
    expect(robots).toContain("User-agent: *\nAllow: /")
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(robots.match(/^Disallow: .+$/gm)).toEqual([
      "Disallow: /og/$",
      "Disallow: /og/index.html",
      "Disallow: /og/sections.json",
    ])
    expect((emitted["llms.txt"] as string).split("\n").slice(0, 3)).toEqual([
      "# dither-ui",
      "",
      expect.stringMatching(/^> /),
    ])
  })

  it("give every share card its Discord component embed and its oEmbed photo", () => {
    expect(cards.map((c) => c.id)).toEqual([...ROUTE_CARDS.map((r) => r.id), ...SECTIONS.map((s) => s.id)])
    for (const card of cards) {
      expect(emitted[`embed/${card.id}.json`]).toBe(componentEmbed(card))
      expect(emitted[`oembed/${card.id}.json`]).toBe(oembed(card))
      expect(new TextEncoder().encode(emitted[`embed/${card.id}.json`] as string).length).toBeLessThan(3000)
    }
    expect(Object.keys(emitted).filter((f) => /^o?embed\//.test(f))).toHaveLength(cards.length * 2)
    // what a page's head points at is a file the build writes
    for (const page of PAGES)
      for (const t of pageTags(page))
        if (t.tag === "link" && /embed/.test(t.attrs.href))
          expect(emitted[t.attrs.href.slice(SITE_URL.length + 1)], t.attrs.href).toBeDefined()
  })

  it("are the install surface: the Studio's manifest and every icon, drawn at build", () => {
    for (const [name, body] of Object.entries(installFiles())) expect(emitted[name]).toEqual(body)
    expect(emitted[MANIFEST]).toBe(webManifest())
    for (const icon of ICONS) {
      const bytes = emitted[icon.path] as Uint8Array
      expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
      const view = new DataView(bytes.buffer, bytes.byteOffset)
      expect([view.getUint32(16), view.getUint32(20)]).toEqual([icon.size, icon.size])
    }
    // each of the manifest's icons resolves from its folder to a file here
    for (const icon of JSON.parse(webManifest()).icons)
      expect(emitted[new URL(icon.src, `https://x/${MANIFEST}`).pathname.slice(1)]).toBeInstanceOf(Uint8Array)
    // and so does every file the heads link to
    for (const t of [...ICON_HEAD, ...APP_HEAD]) if (t.attrs.href) expect(emitted[t.attrs.href]).toBeDefined()
  })

  it("are the bridge as the repo holds it, and the mascot's capture", () => {
    expect(emitted[BRIDGE_FILE]).toBe(read(REPO, BRIDGE_FILE))
    expect((emitted[CAPTURE_PATH] as Uint8Array).length % 32).toBe(0)
    expect((emitted[CAPTURE_PATH] as Uint8Array).length).toBeGreaterThan(0)
  })
})

describe("the shell and the routes", () => {
  const shell = read(SITE, "src/entry-server.tsx")

  it("carries, on the site's pages only, what the Vue build injected into each", () => {
    for (const piece of [
      "data-page={page ?? undefined}",
      "<script innerHTML={PAGE_REVEAL_SCRIPT} />",
      "<script innerHTML={RISE_HEAD_SCRIPT} />",
      '<script type="speculationrules" innerHTML={speculationRules(import.meta.env.BASE_URL)} />',
      "<For each={ICON_HEAD}>",
      '<link href={michroma} rel="preload" as="font" crossorigin="" />',
      "<span id={PAGE_END_ID} hidden />",
    ])
      expect(shell, piece).toContain(piece)
    // the face it fetches with the HTML is the display face's own file
    expect(shell).toContain('import michroma from "@/shared/fonts/michroma-latin.woff2?url"')
    expect(existsSync(join(REPO, "src/shared/fonts/michroma-latin.woff2"))).toBe(true)
    // the marker the hand-off waits for is the last thing in the body
    expect(shell.indexOf("{scripts}")).toBeLessThan(shell.indexOf("PAGE_END_ID} hidden"))
    expect(PAGE_REVEAL_SCRIPT).toContain(`#${PAGE_END_ID}`)
  })

  it("takes the page transition the head's script parked", () => {
    expect(read(SITE, "src/entry-client.tsx")).toContain(
      "takePageTransition((arrival) => void ditherViewTransition(arrival, pageTransitionOptions()))",
    )
  })

  it("sets every page's head from the one table", () => {
    for (const [file, use] of [
      ["src/routes/index.tsx", '<PageHead page="landing" />'],
      ["src/routes/studio.tsx", '<PageHead page="studio" />'],
      ["src/routes/[...404].tsx", '<PageHead page="missing" />'],
      ["src/pages/docs/DocsPage.tsx", '<PageHead page="docs" section={meta().id} />'],
    ]) {
      const source = read(SITE, file)
      expect(source, file).toContain(use)
      // no head tag of its own beside it, but the page's own theme colour
      expect(
        source.match(/<(Title|Link|Meta) [^>]*>/g)?.filter((t) => !/theme-color|\.\.\.t\.attrs|t\.attrs\./.test(t)) ??
          [],
      ).toEqual([])
    }
    // the Studio alone adds the app's manifest and iOS's app tags
    expect(read(SITE, "src/routes/studio.tsx")).toContain("<For each={APP_HEAD}>")
    expect(APP_HEAD.map((t) => t.attrs.rel ?? t.attrs.name)).toEqual(
      expect.arrayContaining(["manifest", "apple-mobile-web-app-capable"]),
    )
    expect(ICON_HEAD.map((t) => t.attrs.rel)).toEqual(["icon", "icon", "apple-touch-icon"])
  })
})

// The pages as built (`npm run build`): checked when a build stands.
const OUT = join(SITE, ".output/public")
describe.skipIf(!existsSync(join(OUT, "index.html")))("the built pages", () => {
  const built = (file: string) => read(OUT, file)
  const page = (id: string) => (id ? `docs/${id}/index.html` : "docs/index.html")
  const SITE_PAGES: [string, "landing" | "docs" | "studio" | "missing", string][] = [
    ["index.html", "landing", ""],
    ["docs/index.html", "docs", ""],
    [page("avatar"), "docs", "avatar"],
    [`${OFFLINE.app}index.html`, "studio", ""],
    ["404.html", "missing", ""],
  ]

  for (const [file, name, section] of SITE_PAGES)
    it(`${file} is the ${name} page from its first byte, its head the table's`, () => {
      const html = built(file)
      const doc = parse(html)
      expect(doc.documentElement.dataset.page).toBe(name)
      const lines = headLines(doc, "none")
      for (const t of pageTags(name, section)) expect(lines, ofTag(t)).toContain(ofTag(t))
      expect(doc.title).toBe(pageTags(name, section).flatMap((t) => (t.tag === "title" ? [t.text] : []))[0])
      expect(doc.head.querySelectorAll("link[rel=canonical]")).toHaveLength(name === "missing" ? 0 : 1)
      // what the shell injects
      const inline = [...doc.head.querySelectorAll("script:not([type]):not([src])")].map((s) => s.textContent)
      expect(inline).toContain(PAGE_REVEAL_SCRIPT)
      expect(inline).toContain(RISE_HEAD_SCRIPT)
      expect(doc.head.querySelector("script[type=speculationrules]")!.textContent).toBe(speculationRules("/"))
      for (const t of ICON_HEAD) {
        const link = doc.head.querySelector(`link[rel="${t.attrs.rel}"][href="/${t.attrs.href}"]`)
        expect(link, t.attrs.href).not.toBeNull()
        expect(existsSync(join(OUT, t.attrs.href))).toBe(true)
      }
      expect(doc.head.querySelectorAll("link[rel=manifest]")).toHaveLength(name === "studio" ? 1 : 0)
      const face = doc.head.querySelector<HTMLLinkElement>(
        'link[rel=preload][as=font][crossorigin][href*="michroma-latin"]',
      )
      expect(existsSync(join(OUT, face!.getAttribute("href")!))).toBe(true)
      expect(doc.body.lastElementChild?.id).toBe(PAGE_END_ID)
      expect(html.match(/name="robots" content="([^"]+)"/g)).toHaveLength(1)
      expect(html).toContain(name === "missing" ? 'name="robots" content="noindex"' : 'content="index, follow"')
    })

  it("gives every sitemap address a page of its own, and every file the plugin emits", async () => {
    for (const [loc] of [...built("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => [m[1]])) {
      const path = new URL(loc).pathname.replace(/^\/|\/$/g, "")
      expect(existsSync(join(OUT, path, "index.html")), loc).toBe(true)
    }
    for (const [name, body] of Object.entries(await siteFileList())) {
      // a section's embed is rewritten after the build with the lede its own
      // page prints (`scripts/postbuild.mjs`): held to standing, not to bytes
      if (name.startsWith("embed/")) expect(existsSync(join(OUT, name)), name).toBe(true)
      else expect(readFileSync(join(OUT, name)).equals(Buffer.from(body)), name).toBe(true)
    }
  })

  it("leaves the player's page out of what the shell gives the site's pages", () => {
    if (!existsSync(join(OUT, "play/index.html"))) return
    const doc = parse(built("play/index.html"))
    expect(doc.documentElement.dataset.page).toBeUndefined()
    expect(doc.head.querySelector("script[type=speculationrules]")).toBeNull()
    expect(doc.getElementById(PAGE_END_ID)).toBeNull()
    expect(built("play/index.html")).not.toContain(RISE_HEAD_SCRIPT)
  })
})
