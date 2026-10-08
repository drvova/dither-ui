// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { editor } from "@/entities/editor"
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
    const r = runCommand({ type: "component.add", is: "DitherSlider", props: { max: 9999, step: "x", disabled: true, bogus: 1 } })
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
      data: { labels: ["Q1", "Q2", "Q3"], series: [{ key: "web", values: [10, 20, 30] }, { key: "app", label: "App", color: "pink", values: [5, "x", 9] }] },
    })
    expect(r.ok).toBe(true)
    const a = editor.artboards[0]
    expect(a.chart.type).toBe("bar")
    expect(a.chart.rows).toEqual([
      { month: "Q1", web: 10, app: 5 },
      { month: "Q2", web: 20, app: 0 },
      { month: "Q3", web: 30, app: 9 },
    ])
    expect(a.chart.series.map((s) => [s.key, s.label, s.color])).toEqual([["web", "web", "blue"], ["app", "App", "pink"]])
    const pie = runCommand({ type: "chart.add", chart: "pie", data: { labels: ["a", "b"], series: [{ key: "whatever", values: [3, 7] }] } })
    expect(pie.ok).toBe(true)
    expect(editor.artboards[1].chart.rows).toEqual([{ name: "a", value: 3 }, { name: "b", value: 7 }])
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

  it("replaces the document through the import validation path", () => {
    expect(runCommand({ type: "document.set", document: { artboards: [] } }).ok).toBe(false)
    const r = runCommand({ type: "document.set", document: { artboards: [{ name: "Imported", chart: { type: "radar" } }, "junk"] } })
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

  it("answers DOM-event commands with string details and keeps a document mirror", async () => {
    const uninstall = installStudioAgentApi()
    expect(window.ditherStudio?.version).toBe(1)
    const result = new Promise<Record<string, unknown>>((resolve) => {
      document.addEventListener(RESULT_EVENT, (e) => resolve(JSON.parse((e as CustomEvent).detail as string)), { once: true })
    })
    document.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: JSON.stringify({ id: "r1", command: { type: "component.add", is: "DitherSwitch" } }) }))
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
      document.addEventListener(RESULT_EVENT, (e) => resolve(JSON.parse((e as CustomEvent).detail as string)), { once: true })
    })
    document.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: "{not json" }))
    expect((await bad).ok).toBe(false)
    uninstall()
    expect(window.ditherStudio).toBeUndefined()
    expect(document.getElementById(MIRROR_ID)).toBeNull()
  })
})
