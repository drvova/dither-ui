// Behaviour the Studio's earlier module specs held that no other spec here
// did, carried over when those specs went: what the composer reads out of
// the harness's updates and its slash commands, the follow-ups it offers,
// the bridge's setup line, the navigation's sticking heads, and a field's
// value set through the protocol.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, render } from "@solidjs/testing-library"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { componentEntry } from "@/entities/widget"
import { GROUPS } from "@/pages/docs/groups"
import { bandFill } from "@/widgets/site-header/menu"
import { editor } from "~/entities/editor"
import { runCommand } from "~/features/agent"
import { bridgeCommand, mapUpdate, settingsOf } from "~/features/agent/acp"
import DocsNav, { NAV_PLACE } from "~/pages/docs/DocsNav"
import { hintOf, slashList, unknownOf } from "~/widgets/agent/model/slash"
import { NEXT_MAX, nextPrompts } from "~/widgets/agent/model/suggest"

afterEach(cleanup)

describe("the harness's updates", () => {
  it("reads its usage update as the context in use", () => {
    expect(
      mapUpdate({ sessionUpdate: "usage_update", used: 52000, size: 200000, cost: { amount: 0.12, currency: "USD" } }),
    ).toEqual([{ type: "context", context: { used: 52000, size: 200000, cost: { amount: 0.12, currency: "USD" } } }])
    expect(mapUpdate({ sessionUpdate: "usage_update", used: 1, size: 0 })).toEqual([])
    expect(mapUpdate({ sessionUpdate: "usage_update", used: "x", size: 10 })).toEqual([])
  })

  const options = [
    {
      id: "model",
      name: "Model",
      category: "model",
      type: "select",
      currentValue: "opus",
      options: [{ value: "opus", name: "Opus" }],
    },
    {
      id: "mode",
      name: "Mode",
      category: "mode",
      type: "select",
      currentValue: "ask",
      options: [{ value: "ask" }, { value: "code" }],
    },
    {
      id: "effort",
      name: "Effort",
      type: "select",
      currentValue: "high",
      options: [
        {
          group: "levels",
          options: [
            { value: "low", name: "Low" },
            { value: "high", name: "High" },
          ],
        },
      ],
    },
    { id: "only", name: "Only", type: "select", currentValue: "a", options: [{ value: "a" }] },
    { id: "free", name: "Free", type: "text", currentValue: "x" },
  ]

  it("offers the selects besides model and mode that have a choice", () => {
    expect(settingsOf({ configOptions: options })).toEqual([
      {
        configId: "effort",
        name: "Effort",
        current: "high",
        options: [
          { id: "low", name: "Low", description: undefined },
          { id: "high", name: "High", description: undefined },
        ],
      },
    ])
    expect(settingsOf({ configOptions: "junk" })).toEqual([])
  })

  it("come with every config update, the model beside them", () => {
    const got = mapUpdate({ sessionUpdate: "config_option_update", configOptions: options })
    expect(got.map((e) => e.type)).toEqual(["model", "settings"])
  })
})

describe("slash commands", () => {
  it("say what a picked command still takes, and know a /word that is none", () => {
    const all = slashList([{ name: "review", description: "Review the diff", input: "<path>" }])
    expect(hintOf("/harness ", all)).toBe("/harness <id | command>")
    expect(hintOf("/review ", all)).toBe("/review <path>")
    expect(hintOf("/new ", all)).toBe("")
    expect(hintOf("/harness claude", all)).toBe("")
    expect(unknownOf("/frob it", all)).toBe("frob")
    expect(unknownOf("/review src", all)).toBeNull()
    expect(unknownOf("plain words", all)).toBeNull()
  })
})

describe("what to ask next", () => {
  it("offers follow-ups the Studio's tools can do, about the frames a turn touched", () => {
    expect(nextPrompts([])).toEqual([])
    expect(nextPrompts([{ id: "a", name: "Sign in" }])).toEqual([
      "Evolve Sign in into four variants",
      "Show the code for Sign in",
      "Export Sign in as a video",
    ])
    const three = nextPrompts([
      { id: "a", name: "Sign in" },
      { id: "b", name: "Dashboard" },
      { id: "c", name: "Table" },
    ])
    expect(three[0]).toBe("Cut Sign in, Dashboard and 1 more into a reel")
    expect(three.length).toBeLessThanOrEqual(NEXT_MAX)
    // A long name is cut so a row stays one line.
    expect(nextPrompts([{ id: "a", name: "A very long frame name that runs on and on" }])[0]).toBe(
      "Evolve A very long frame name… into four variants",
    )
  })
})

describe("the bridge's setup line", () => {
  const file = new URL("https://dither-ui.com/bridge/dither-bridge.mjs")

  it("fetches the served bridge and runs it, nothing more for the site's own page", () => {
    expect(bridgeCommand(new URL("https://dither-ui.com/studio"), file, "ws://127.0.0.1:8790")).toBe(
      "curl -fsSL https://dither-ui.com/bridge/dither-bridge.mjs -o ~/dither-bridge.mjs && node ~/dither-bridge.mjs",
    )
  })

  it("names an origin the bridge would refuse and a port it would not listen on", () => {
    const line = bridgeCommand(new URL("https://drvova.github.io/dither-ui/studio"), file, "ws://127.0.0.1:9000")
    expect(line.endsWith(" --origin https://drvova.github.io --port 9000")).toBe(true)
    expect(bridgeCommand(new URL("http://localhost:4310/studio"), file, "not a url")).not.toContain("--")
  })
})

// The section lists keep each group's heading stuck to the top, the list's
// top room on the list itself (never the scroller's padding).
describe("docs section list landmarks", () => {
  it("sticks each group heading on its place's ground", () => {
    // The rail: on the page's ground, unseen.
    const rail = render(() => <DocsNav activeId="" variant="rail" />).container.firstElementChild as HTMLElement
    expect(rail.className).toContain(NAV_PLACE.rail.top)
    const heads = [...rail.querySelectorAll(".sticky")]
    expect(heads.length).toBeGreaterThan(5)
    for (const c of NAV_PLACE.rail.head.split(" ")) expect([...heads[0].classList]).toContain(c)
    cleanup()
    // The sheet: each family a band, its heading sticking on the band's own fill.
    const sheet = render(() => <DocsNav activeId="" variant="sheet" />).container
    const groups = [...sheet.querySelectorAll<HTMLElement>(".nav-grp")]
    expect(groups).toHaveLength(GROUPS.length)
    groups.forEach((g, i) => {
      expect(g.style.background).toBe(bandFill(i, GROUPS.length))
      expect(g.querySelector<HTMLElement>(".sticky")!.style.background).toBe(bandFill(i, GROUPS.length))
    })
  })
})

describe("the inspector's name column", () => {
  it("lets a number field's name sit in a pair's grid", () => {
    const css = readFileSync(join(process.cwd(), "../src/app/styles.css"), "utf8")
    expect(css).toMatch(/\.prop-pairs \{[^}]*grid-template-columns: var\(--prop-name\)/)
    expect(css).toMatch(/\.prop-name \{[^}]*width: var\(--prop-name\)/)
  })
})

describe("a field's value", () => {
  beforeEach(() => {
    editor.artboards = []
    editor.selectedIds = []
  })

  it("is set through the protocol: a component, a screen's cells, and an update", () => {
    const c = runCommand({ type: "component.add", is: "DitherEmailInput", value: "" })
    expect(c.ok).toBe(true)
    const a = editor.artboards[0]
    expect(a.widget?.kind === "component" && a.widget.model).toBe("")
    runCommand({ type: "artboard.update", id: a.id, patch: { widget: { value: "you@studio.com" } } })
    expect(a.widget?.kind === "component" && a.widget.model).toBe("you@studio.com")
    runCommand({ type: "artboard.update", id: a.id, patch: { widget: { value: { evil: true } } } })
    expect(a.widget?.kind === "component" && a.widget.model).toBe(componentEntry("DitherEmailInput")!.vmodel!.def)

    const s = runCommand({
      type: "screen.add",
      rows: [
        {
          cells: [
            { is: "DitherEmailInput", value: "" },
            { is: "DitherSwitch", value: 7 },
          ],
        },
      ],
    })
    expect(s.ok).toBe(true)
    const screen = editor.artboards[1].widget
    if (screen?.kind !== "screen") throw new Error("no screen")
    expect(screen.rows[0].cells.map((x) => x.model)).toEqual(["", componentEntry("DitherSwitch")!.vmodel!.def])
  })

  it("changes a screen's cells under widget, and refuses rows put beside it", () => {
    const s = runCommand({
      type: "screen.add",
      rows: [{ cells: [{ is: "DitherEmailInput", value: "ada@example.com" }] }],
    })
    if (!s.ok) throw new Error(s.error)
    const id = (s.data as { id: string }).id
    const cells = () => {
      const w = editor.artboards.find((a) => a.id === id)?.widget
      return w?.kind === "screen" ? w.rows[0].cells.map((c) => c.model) : null
    }
    // Where an agent put them in a live run: told so, nothing changed.
    const wrong = runCommand({
      type: "artboard.update",
      id,
      patch: { name: "Card", rows: [{ cells: [{ is: "DitherEmailInput", value: "" }] }] },
    })
    expect(wrong.ok).toBe(false)
    expect(wrong.ok ? "" : wrong.error).toContain("does not take rows")
    expect(editor.artboards.find((a) => a.id === id)?.name).not.toBe("Card")
    expect(cells()).toEqual(["ada@example.com"])
    const right = runCommand({
      type: "artboard.update",
      id,
      patch: { widget: { rows: [{ cells: [{ is: "DitherEmailInput", value: "" }] }] } },
    })
    expect(right.ok).toBe(true)
    expect(cells()).toEqual([""])
  })
})
