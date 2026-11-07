// @rstest-environment jsdom
// The docs mount a pack of sections only once one is opened (`packs.ts`).
// That holds only while each pack renders exactly the sections its nav
// names: a section a pack renders but its nav forgets would never mount.
// The prerender asks for every pack and reads each family's name off its
// heading, so those two seams are pinned too.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "rstack/test"
import { mount } from "@vue/test-utils"
import DocsNav from "@/pages/docs/DocsNav.vue"
import { GROUPS } from "@/pages/docs/groups"
import { ALL_SECTIONS_PARAM, PACKS, PACKS_KEPT, packOpen, type PackName, visitPack } from "@/pages/docs/packs"

const root = new URL("..", import.meta.url).pathname
const DOCS = join(root, "src/pages/docs")

function find(name: string, dir = DOCS): string | null {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      const hit = find(name, path)
      if (hit) return hit
    } else if (entry === `${name}.vue`) return path
  }
  return null
}

describe("docs section packs", () => {
  it("each pack renders exactly the sections its nav names", () => {
    for (const [name, nav] of Object.entries(PACKS)) {
      const file = find(name)
      expect({ name, file: !!file }).toEqual({ name, file: true })
      // The pack's own sections and those of the section files it imports.
      const own = readFileSync(file!, "utf8")
      const parts = [...own.matchAll(/^import \w+ from "\.\/(\w+Section)\.vue"/gm)].map((m) =>
        readFileSync(join(file!, "..", `${m[1]}.vue`), "utf8"),
      )
      const ids = [own, ...parts]
        .flatMap((src) => [...src.matchAll(/<section[^>]*\sid="([\w-]+)"/g)].map((m) => m[1]))
        .sort()
      expect({ name, ids }).toEqual({ name, ids: nav.map((i) => i.id).sort() })
    }
  })

  it("mounts a pack once one of its sections is opened, or all for the prerender", () => {
    const name: PackName = "BackgroundsDocs"
    const first = PACKS[name][0].id
    expect(packOpen(name, [], false)).toBe(false)
    expect(packOpen(name, visitPack([], "getting-started"), false)).toBe(false)
    expect(packOpen(name, visitPack([], first), false)).toBe(true)
    expect(packOpen(name, [], true)).toBe(true)
  })

  it("keeps the last packs read mounted, never the whole docs", () => {
    // every section opened in one tab once kept 62k nodes and 461 canvases
    let kept: readonly PackName[] = []
    for (const nav of Object.values(PACKS)) for (const { id } of nav) kept = visitPack(kept, id)
    expect(kept).toEqual((Object.keys(PACKS) as PackName[]).slice(-PACKS_KEPT))
    // going back to one still kept makes it the newest, and lets go of none
    const back = visitPack(kept, PACKS[kept[0]][0].id)
    expect(back).toEqual([...kept.slice(1), kept[0]])
    // a section DocsPage writes itself changes nothing
    expect(visitPack(back, "getting-started")).toBe(back)
  })

  it("is asked for whole by the prerender, which reads each family's name off its heading", () => {
    const prerender = readFileSync(join(root, "scripts/prerender.mjs"), "utf8")
    expect(prerender).toContain(`"?${ALL_SECTIONS_PARAM}"`)
    expect(prerender).toContain('getAttribute("data-group")')
    const w = mount(DocsNav, { props: { activeId: "", variant: "rail" } })
    expect(w.findAll("button[aria-expanded]").map((b) => b.attributes("data-group"))).toEqual(
      GROUPS.map((g) => g.title),
    )
    w.unmount()
  })
})

describe("the packs as chunks of their own", () => {
  it("loads the open section's pack before the page renders, every pack for the prerender", async () => {
    const { PACK_LOADERS, preloadOpenPacks } = await import("@/pages/docs/pack-loaders")
    expect(Object.keys(PACK_LOADERS).sort()).toEqual(Object.keys(PACKS).sort())
    const loaded: string[] = []
    const real = { ...PACK_LOADERS }
    for (const name of Object.keys(PACK_LOADERS) as PackName[])
      PACK_LOADERS[name] = (() => (loaded.push(name), real[name]())) as never
    history.replaceState(null, "", "/docs/aurora")
    await preloadOpenPacks()
    expect(loaded).toEqual(["BackgroundsDocs"])
    loaded.length = 0
    history.replaceState(null, "", `/docs?${ALL_SECTIONS_PARAM}`)
    await preloadOpenPacks()
    expect(loaded.sort()).toEqual(Object.keys(PACKS).sort())
    loaded.length = 0
    // a section DocsPage writes itself has no pack to load
    history.replaceState(null, "", "/docs/area")
    await preloadOpenPacks()
    expect(loaded).toEqual([])
    Object.assign(PACK_LOADERS, real)
  })
})
