// The Studio's component registry, held to the Solid kit: every prop a row
// binds (its `PropSpec` keys, after its `mapProps`, a field's label left to
// its DitherField) is a prop its component really takes, by the type
// checker, the way the docs' API tables are held (`docs-api.ts`).
import { describe, expect, it } from "vitest"
import { FACTS } from "#dither-facts"
import { boundProps, COMPONENT_REGISTRY, defaultComponentProps } from "@/entities/widget/model/registry"
import { kitProps } from "./docs-api"

const kit = kitProps()

/** Keys a row edits that are not its component's props, with the reason. */
const NOT_A_PROP: Record<string, string[]> = {
  // the Studio's toaster demo hands them to `toast()`, the call a toaster
  // shows (`WidgetRenderer`'s "Show toast"); the toaster takes neither
  DitherToaster: ["color", "message"],
  // an editable list the row's `mapProps` reads into the prop it makes
  // (`rounds`, `events`), which is checked in its place
  DitherBracket: ["teams"],
  DitherSchedule: ["slots"],
}

describe("the component registry", () => {
  it("names a component of the kit in every row", () => {
    expect(COMPONENT_REGISTRY.filter((e) => !kit.has(e.is)).map((e) => e.is)).toEqual([])
  })

  it("binds only props its component takes", () => {
    // its editable keys (what the code export writes) and what its row
    // hands the component once mapped
    const wrong = COMPONENT_REGISTRY.flatMap((e) => {
      const keys = new Set([
        ...e.props.filter((p) => !(e.field && p.key === "label")).map((p) => p.key),
        ...Object.keys(boundProps(e.is, defaultComponentProps(e))),
      ])
      return [...keys]
        .filter((key) => !kit.get(e.is)?.has(key) && !NOT_A_PROP[e.is]?.includes(key))
        .map((key) => `${e.is}.${key}`)
    })
    expect(wrong).toEqual([])
    // every exception is still a row's key
    for (const [is, keys] of Object.entries(NOT_A_PROP))
      expect(
        COMPONENT_REGISTRY.find((e) => e.is === is)?.props.map((p) => p.key),
        is,
      ).toEqual(expect.arrayContaining(keys))
  })

  it("counts the kit the build counts", () => {
    // the build counts the index's `Dither*` exports; the checker, the
    // components among them
    expect([...kit.keys()].filter((n) => n.startsWith("Dither")).length).toBe(FACTS.components)
  })
})
