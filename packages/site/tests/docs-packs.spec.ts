// @rstest-environment jsdom
// The docs mount a pack of sections only once one is opened (`packs.ts`),
// keep the last packs read and drop the rest. (That each pack renders
// exactly the sections its nav names is held by rendering them, in the
// docs' component spec, in `site/`.)
import { describe, expect, it } from "rstack/test"
import type { PackName } from "@/pages/docs/groups"
import { PACKS, PACKS_KEPT, packOpen, visitPack } from "@/pages/docs/packs"

describe("docs section packs", () => {
  it("mounts a pack once one of its sections is opened", () => {
    const name: PackName = "BackgroundsDocs"
    const first = PACKS[name][0].id
    expect(packOpen(name, [])).toBe(false)
    expect(packOpen(name, visitPack([], "getting-started"))).toBe(false)
    expect(packOpen(name, visitPack([], first))).toBe(true)
  })

  it("keeps the last packs read mounted, never the whole docs", () => {
    // every section opened in one tab once kept 62k nodes and 461 canvases
    let kept: readonly PackName[] = []
    for (const nav of Object.values(PACKS)) for (const { id } of nav) kept = visitPack(kept, id)
    expect(kept).toEqual((Object.keys(PACKS) as PackName[]).slice(-PACKS_KEPT))
    // going back to one still kept makes it the newest, and lets go of none
    const back = visitPack(kept, PACKS[kept[0]][0].id)
    expect(back).toEqual([...kept.slice(1), kept[0]])
    // an id no section has changes nothing
    expect(visitPack(back, "no-such-section")).toBe(back)
  })
})
