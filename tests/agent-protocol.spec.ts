// @rstest-environment jsdom
import { beforeEach, describe, expect, it, rs } from "rstack/test"
import { editor } from "@/entities/editor"
import { callStudioTool } from "@/features/agent/tools"
import { directedTime, isDirected, release } from "../dither-kit/engine/clock"
import {
  COMMAND_EVENT,
  installStudioAgentApi,
  MIRROR_ID,
  registrySchema,
  RESULT_EVENT,
  runCommand,
} from "@/features/agent"

beforeEach(() => {
  editor.artboards = []
  editor.groups = []
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.viewport = { x: 0, y: 0, zoom: 1 }
})

describe("studio agent protocol", () => {
  it("rejects malformed input without throwing", () => {
    expect(runCommand(null).ok).toBe(false)
    expect(runCommand({ type: "nope" }).ok).toBe(false)
    expect(runCommand({ type: "component.add", is: "DitherNotAThing" })).toMatchObject({ ok: false })
  })

  it("adds registry components with sanitized props", () => {
    const r = runCommand({
      type: "component.add",
      is: "DitherSlider",
      props: { max: 9999, step: "x", disabled: true, bogus: 1 },
    })
    expect(r.ok).toBe(true)
    const a = editor.artboards[0]
    expect(a.widget?.kind).toBe("component")
    if (a.widget?.kind === "component") {
      expect(a.widget.is).toBe("DitherSlider")
      expect(a.widget.props.disabled).toBe(true)
      expect(a.widget.props.step).toBe(1) // junk type → default
      expect("bogus" in a.widget.props).toBe(false)
    }
  })

  it("composes screens, dropping unknown cells and reporting them", () => {
    const r = runCommand({
      type: "screen.add",
      name: "Sign in",
      rows: [
        { cells: [{ is: "DitherInput", props: { placeholder: "Email" }, grow: true }], gap: 8 },
        { cells: [{ is: "DitherBadge", slotText: "Continue" }, { is: "DitherNope" }], justify: "end" },
      ],
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect((r.data as { dropped: string[] }).dropped).toEqual(["DitherNope"])
    const a = editor.artboards[0]
    expect(a.name).toBe("Sign in")
    if (a.widget?.kind === "screen") {
      expect(a.widget.rows).toHaveLength(2)
      expect(a.widget.rows[0].cells[0].props.placeholder).toBe("Email")
      expect(a.widget.rows[0].cells[0].grow).toBe(true)
      expect(a.widget.rows[1].cells.map((c) => c.is)).toEqual(["DitherBadge"])
      expect(a.widget.rows[1].justify).toBe("end")
    }
  })

  it("adds charts from the friendly data shape", () => {
    const r = runCommand({
      type: "chart.add",
      chart: "bar",
      name: "Signups",
      data: {
        labels: ["Q1", "Q2", "Q3"],
        series: [
          { key: "web", values: [10, 20, 30] },
          { key: "app", label: "App", color: "pink", values: [5, "x", 9] },
        ],
      },
    })
    expect(r.ok).toBe(true)
    const a = editor.artboards[0]
    expect(a.chart.type).toBe("bar")
    expect(a.chart.rows).toEqual([
      { month: "Q1", web: 10, app: 5 },
      { month: "Q2", web: 20, app: 0 },
      { month: "Q3", web: 30, app: 9 },
    ])
    expect(a.chart.series.map((s) => [s.key, s.label, s.color])).toEqual([
      ["web", "web", "blue"],
      ["app", "App", "pink"],
    ])
    const pie = runCommand({
      type: "chart.add",
      chart: "pie",
      data: { labels: ["a", "b"], series: [{ key: "whatever", values: [3, 7] }] },
    })
    expect(pie.ok).toBe(true)
    expect(editor.artboards[1].chart.rows).toEqual([
      { name: "a", value: 3 },
      { name: "b", value: 7 },
    ])
  })

  it("updates, lists, codes, evolves and removes frames", () => {
    runCommand({ type: "widget.add", widget: "button", props: { label: "Go", color: "orange", variant: "nonsense" } })
    const id = editor.artboards[0].id
    const up = runCommand({ type: "artboard.update", id, patch: { name: "CTA", w: 300, widget: { variant: "solid" } } })
    expect(up.ok).toBe(true)
    const a = editor.artboards[0]
    expect(a.name).toBe("CTA")
    expect(a.w).toBe(300)
    if (a.widget?.kind === "button") {
      expect(a.widget.label).toBe("Go")
      expect(a.widget.variant).toBe("solid")
    }
    const list = runCommand({ type: "artboard.list" })
    expect(list.ok && (list.data as unknown[]).length).toBe(1)
    const code = runCommand({ type: "code.get", id })
    expect(code.ok && String((code.data as { code: string }).code)).toContain("DitherButton")
    const gen = runCommand({ type: "evolve", id, count: 3, seed: 5 })
    expect(gen.ok && (gen.data as unknown[]).length).toBe(3)
    expect(editor.artboards).toHaveLength(4)
    expect(editor.selectedIds).toHaveLength(3)
    expect(runCommand({ type: "artboard.remove", id }).ok).toBe(true)
    expect(editor.artboards).toHaveLength(3)
  })

  it("writes a frame's code in the asked styling system", () => {
    const added = runCommand({ type: "widget.add", widget: "image" })
    const id = (added as { data: { id: string } }).data.id
    const css = runCommand({ type: "code.get", id, styling: "css" })
    expect(css.ok && (css.data as { styling: string }).styling).toBe("css")
    const code = String((css.data as { code: string }).code)
    expect(code).toContain("<style scoped>")
    expect(code).toContain(".box {\n  height: 16rem;\n}")
    expect(code).not.toContain('class="h-64"')
    const sx = runCommand({ type: "code.get", id, styling: "stylex" })
    expect(sx.ok && String((sx.data as { code: string }).code)).toContain("stylex.create({")
    const plain = runCommand({ type: "code.get", id })
    expect(plain.ok && String((plain.data as { code: string }).code)).toContain('class="h-64"')
    expect(runCommand({ type: "code.get", id, styling: "sass" }).ok).toBe(false)
    expect(registrySchema().commands["code.get"]).toContain("stylex")
  })

  it("replaces the document through the import validation path", () => {
    expect(runCommand({ type: "document.set", document: { artboards: [] } }).ok).toBe(false)
    const r = runCommand({
      type: "document.set",
      document: { artboards: [{ name: "Imported", chart: { type: "radar" } }, "junk"] },
    })
    expect(r.ok).toBe(true)
    expect(editor.artboards).toHaveLength(1)
    expect(editor.artboards[0].chart.type).toBe("radar")
    expect(typeof editor.artboards[0].id).toBe("string")
    const got = runCommand({ type: "document.get" })
    expect(got.ok && (got.data as { artboards: unknown[] }).artboards.length).toBe(1)
  })

  it("serves the registry with every component's prop specs", () => {
    const reg = registrySchema()
    expect(reg.components.length).toBeGreaterThan(50)
    expect(reg.components.find((c) => c.is === "DitherSlider")?.props.map((p) => p.key)).toContain("max")
    const one = runCommand({ type: "registry.get", is: "DitherTabs" })
    expect(one.ok && (one.data as { is: string }).is).toBe("DitherTabs")
    expect(JSON.parse(JSON.stringify(reg))).toBeTruthy()
  })

  it("gives a harness the brief registry it can read in one answer, and one component in full", () => {
    // A harness spills a long tool answer to a file and greps it: the names
    // must fit one answer (well under 25k tokens).
    const brief = callStudioTool("get_registry", {})
    expect(brief.ok).toBe(true)
    const comps = (brief.data as { components: Record<string, unknown>[] }).components
    expect(comps.length).toBe(registrySchema().components.length)
    expect(Object.keys(comps[0]).sort()).toEqual(["group", "is", "label"])
    expect(JSON.stringify(brief.data).length).toBeLessThan(40_000)
    const one = callStudioTool("get_registry", { is: "DitherSlider" })
    expect((one.data as { props: { key: string }[] }).props.map((p) => p.key)).toContain("max")
  })

  it("answers DOM-event commands with string details and keeps a document mirror", async () => {
    const uninstall = installStudioAgentApi()
    expect(window.ditherStudio?.version).toBe(1)
    const result = new Promise<Record<string, unknown>>((resolve) => {
      document.addEventListener(RESULT_EVENT, (e) => resolve(JSON.parse((e as CustomEvent).detail as string)), {
        once: true,
      })
    })
    document.dispatchEvent(
      new CustomEvent(COMMAND_EVENT, {
        detail: JSON.stringify({ id: "r1", command: { type: "component.add", is: "DitherSwitch" } }),
      }),
    )
    const got = await result
    expect(got.id).toBe("r1")
    expect(got.ok).toBe(true)
    expect(editor.artboards).toHaveLength(1)
    const mirror = document.getElementById(MIRROR_ID) as HTMLScriptElement
    expect(mirror.type).toBe("application/json")
    await new Promise((r) => setTimeout(r, 500))
    expect(JSON.parse(mirror.textContent || "{}").artboards).toHaveLength(1)
    // Malformed detail answers with an error instead of throwing.
    const bad = new Promise<Record<string, unknown>>((resolve) => {
      document.addEventListener(RESULT_EVENT, (e) => resolve(JSON.parse((e as CustomEvent).detail as string)), {
        once: true,
      })
    })
    document.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: "{not json" }))
    expect((await bad).ok).toBe(false)
    uninstall()
    expect(window.ditherStudio).toBeUndefined()
    expect(document.getElementById(MIRROR_ID)).toBeNull()
  })
})

describe("video.export", () => {
  it("returns a composition referencing the player, with the assets to fetch", () => {
    editor.artboards = []
    const added = runCommand({ type: "component.add", is: "DitherBadge", name: "Hero badge", slotText: "New" })
    expect(added.ok).toBe(true)
    const r = runCommand({ type: "video.export", seconds: 3, fps: 60, theme: "light" })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const d = r.data as {
      file: string
      index: string
      assets: { path: string; url: string }[]
      render: string
      options: { seconds: number }
    }
    expect(d.file).toBe("hero-badge.hyperframes.html")
    expect(d.options.seconds).toBe(3)
    expect(d.index).toContain('data-composition-id="dither-hero-badge"')
    expect(d.index).toContain('data-duration="3" data-fps="60"')
    expect(d.index).toContain('<script src="./player.js"></script>')
    expect(d.assets.map((a) => a.path)).toEqual(["player.js", "player.css"])
    expect(d.assets[0].url).toMatch(/^http.*\/play\/player\.js$/)
    expect(d.render).toContain("npx hyperframes render")
    expect(runCommand({ type: "video.export", id: "nope" }).ok).toBe(false)
  })
})

describe("clock commands", () => {
  it("hold and free the kit clock for any driver, from the protocol and the window API", () => {
    expect(runCommand({ type: "clock.seek", seconds: 1.5 })).toEqual({
      ok: true,
      data: { directed: true, seconds: 1.5 },
    })
    expect(isDirected()).toBe(true)
    expect(directedTime()).toBe(1500)
    expect(runCommand({ type: "clock.seek", seconds: -1 }).ok).toBe(false)
    expect(runCommand({ type: "clock.seek" })).toEqual({ ok: true, data: { directed: false } })
    expect(isDirected()).toBe(false)
    runCommand({ type: "clock.seek", seconds: 2 })
    expect(runCommand({ type: "clock.release" })).toEqual({ ok: true, data: { directed: false } })
    const off = installStudioAgentApi()
    window.ditherStudio!.clock.seek(0.25)
    expect(window.ditherStudio!.clock.time()).toBe(0.25)
    expect(window.ditherStudio!.clock.directed()).toBe(true)
    window.ditherStudio!.clock.release()
    expect(window.ditherStudio!.clock.directed()).toBe(false)
    expect(registrySchema().commands["clock.seek"]).toContain("seconds")
    off()
    release()
  })
})

describe("the canvas bar's actions", () => {
  const add = (name: string) => {
    const r = runCommand({ type: "component.add", is: "DitherBadge", name, slotText: name })
    if (!r.ok) throw new Error(r.error)
    return (r.data as { id: string }).id
  }

  it("duplicates, groups and ungroups the frames named, or the selection", () => {
    const a = add("One")
    const b = add("Two")
    const dup = runCommand({ type: "artboard.duplicate", id: a })
    expect(dup.ok).toBe(true)
    expect(editor.artboards).toHaveLength(3)
    expect(runCommand({ type: "artboard.duplicate", ids: ["nope"] })).toEqual({ ok: false, error: "no artboard nope" })

    const g = runCommand({ type: "group", ids: [a, b], name: "Pair" })
    expect(g.ok).toBe(true)
    if (!g.ok) return
    const frames = g.data as { id: string; group: string }[]
    expect(frames.map((f) => f.id)).toEqual([a, b])
    expect(editor.groups).toEqual([expect.objectContaining({ name: "Pair", id: frames[0].group })])
    // Ungrouped by a frame of the group.
    expect(runCommand({ type: "ungroup", id: b })).toMatchObject({ ok: true })
    expect(editor.groups).toEqual([])
    expect(runCommand({ type: "ungroup", id: b }).ok).toBe(false)
  })

  it("moves the view through the canvas's own functions, and holds while the workbench inspects", () => {
    editor.stage = { w: 800, h: 600 }
    const a = add("Wide")
    expect(runCommand({ type: "view", to: "in" })).toMatchObject({ ok: true, data: { zoom: 1.2 } })
    expect(runCommand({ type: "view", zoom: 2 })).toMatchObject({ ok: true, data: { zoom: 2 } })
    expect(runCommand({ type: "view", to: "actual" })).toMatchObject({ ok: true, data: { zoom: 1 } })
    expect(runCommand({ type: "view", id: a })).toMatchObject({ ok: true })
    expect(editor.selectedIds).toEqual([a])
    expect(runCommand({ type: "view", to: "sideways" as never }).ok).toBe(false)
    expect(runCommand({ type: "view", zoom: -1 }).ok).toBe(false)
    editor.inspecting = true
    expect(runCommand({ type: "view", zoom: 2 })).toMatchObject({ ok: true, data: { zoom: 1, inspecting: true } })
    editor.inspecting = false
  })

  it("names a PNG's place under the project, at the scales it takes", () => {
    add("Hero badge")
    expect(runCommand({ type: "image.export" })).toMatchObject({
      ok: true,
      data: { file: "image/hero-badge.png", scale: 2 },
    })
    expect(runCommand({ type: "image.export", scale: 9 }).ok).toBe(false)
  })

  it("inspects a frame as drawn: its controls in Tab order and what the floor finds", () => {
    const id = add("Form")
    // The canvas draws the frame; here, by hand, as Artboard stamps it.
    const frame = document.createElement("div")
    frame.dataset.artboardId = id
    frame.innerHTML = `<div data-artboard-surface><button>Save</button><button></button><img src="x.png"></div>`
    document.body.append(frame)
    // jsdom lays nothing out: a 40px box each, so nothing reads as hidden or small.
    const box = { x: 0, y: 0, top: 0, left: 0, right: 40, bottom: 40, width: 40, height: 40, toJSON: () => ({}) }
    const rect = rs.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect)
    const r = runCommand({ type: "inspect", id })
    rect.mockRestore()
    frame.remove()
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const d = r.data as {
      controls: { role: string; name: string }[]
      issues: { kind: string }[]
      passes: boolean
    }
    expect(d.controls.map((c) => [c.role, c.name])).toEqual([
      ["button", "Save"],
      ["button", ""],
    ])
    expect(d.issues.map((i) => i.kind).sort()).toEqual(["alt", "name"])
    expect(d.passes).toBe(false)
    // Not on the page: said so.
    expect(runCommand({ type: "inspect", id })).toMatchObject({ ok: false })
  })

  it("replays every frame's entrance", () => {
    add("One")
    const before = editor.replayToken
    expect(runCommand({ type: "replay" })).toMatchObject({ ok: true, data: { replayed: 1 } })
    expect(editor.replayToken).toBe(before + 1)
  })
})
