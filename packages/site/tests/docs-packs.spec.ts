// @rstest-environment jsdom
// A docs section's page holds its own pack of sections (`packs.ts`), found
// by the section's id. (That each pack renders exactly the sections its nav
// names is held by rendering them, in the docs' component spec, in `site/`.)
import { describe, expect, it } from "rstack/test"
import type { PackName } from "@/pages/docs/groups"
import { PACK_NAMES, PACKS, packOf } from "@/pages/docs/packs"

describe("docs section packs", () => {
  it("finds every section's pack, and none for an id no section has", () => {
    for (const name of PACK_NAMES) for (const { id } of PACKS[name]) expect(packOf(id)).toBe(name)
    const name: PackName = "BackgroundsDocs"
    expect(packOf(PACKS[name][0].id)).toBe(name)
    expect(packOf("no-such-section")).toBeUndefined()
  })
})
