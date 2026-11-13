// @rstest-environment jsdom
// The docs mount a pack of sections only once one is opened (`packs.ts`),
// keep the last packs read and drop the rest. (That each pack renders
// exactly the sections its nav names is held by rendering them, in the
// Solid site's docs spec.)
import { describe, expect, it } from "rstack/test"
import { PACKS, PACKS_KEPT, packOpen, type PackName, visitPack } from "@/pages/docs/packs"

describe("docs section packs", () => {
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
})
