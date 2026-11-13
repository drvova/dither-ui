// The reel's cut and the film through the store and the protocol (its
// timeline, camera and score are held by the framework-free specs beside
// this folder).
import { beforeEach, describe, expect, it } from "vitest"
import { widgetCode } from "@/entities/widget/model/codegen"
import { addArtboard, addReelArtboard, editor, removeArtboard } from "@/entities/editor"
import { registrySchema, runCommand } from "@/features/agent"
import { defaultSeconds, reelClips } from "@/features/export-video"

beforeEach(() => {
  editor.artboards = []
  editor.groups = []
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.viewport = { x: 0, y: 0, zoom: 1 }
})

describe("reel model", () => {
  it("cuts selected frames into a reel sized like the first clip and prunes removed frames", () => {
    const a = addArtboard("button")
    a.w = 300
    a.h = 200
    const b = addArtboard("avatar")
    const reel = addReelArtboard([a.id, b.id, a.id, "nope"])
    expect(reel.name).toBe("Reel")
    expect([reel.w, reel.h]).toEqual([300, 200])
    if (reel.widget?.kind !== "reel") throw new Error("unreachable")
    expect(reel.widget.clips.map((c) => c.id)).toEqual([a.id, b.id])
    // A reel is never a clip; a removed frame leaves the cut.
    const outer = addReelArtboard([reel.id, b.id])
    if (outer.widget?.kind !== "reel") throw new Error("unreachable")
    expect(outer.widget.clips.map((c) => c.id)).toEqual([b.id])
    removeArtboard(b.id)
    expect(reel.widget.clips.map((c) => c.id)).toEqual([a.id])
    expect(outer.widget.clips).toEqual([])
    expect(reelClips(reel).map((f) => f.id)).toEqual([a.id])
    expect(reelClips(a)).toEqual([])
    expect(defaultSeconds(a)).toBe(6)
    expect(defaultSeconds(reel)).toBe(3)
  })
})

describe("reel protocol", () => {
  it("adds a reel from clip specs, exports it as one composition, and patches its cut", () => {
    const a = runCommand({ type: "component.add", is: "DitherBadge", name: "Badge" })
    const b = runCommand({ type: "chart.add", chart: "bar", name: "Bars" })
    if (!a.ok || !b.ok) throw new Error("setup")
    const ids = [(a.data as { id: string }).id, (b.data as { id: string }).id]
    expect(runCommand({ type: "reel.add", clips: [] })).toMatchObject({ ok: false })
    expect(runCommand({ type: "reel.add", clips: ["missing"] })).toEqual({ ok: false, error: "no artboard missing" })
    const r = runCommand({
      type: "reel.add",
      name: "Cut",
      clips: [
        ids[0],
        { id: ids[1], seconds: 2, transition: { kind: "wipe-left", seconds: 0.5, cell: 8, seed: 3 } },
        ids[0],
      ],
      frame: { w: 640, h: 360 },
    })
    expect(r.ok).toBe(true)
    const data = r.ok
      ? (r.data as { id: string; kind: string; w: number; h: number; seconds: number; clips: unknown[] })
      : null
    expect(data).toMatchObject({ kind: "reel", name: "Cut", w: 640, h: 360, seconds: 5 })
    const still = { camera: [], callouts: [], chapter: null }
    expect(data?.clips).toEqual([
      { id: ids[0], seconds: 3, transition: { kind: "dissolve", seconds: 0.6, cell: 4, seed: null }, ...still },
      { id: ids[1], seconds: 2, transition: { kind: "wipe-left", seconds: 0.5, cell: 8, seed: 3 }, ...still },
    ])
    expect(registrySchema().commands["reel.add"]).toContain("wipe-up")
    // A reel cannot clip a reel.
    expect(runCommand({ type: "reel.add", clips: [data!.id] })).toMatchObject({ ok: false })

    const v = runCommand({ type: "video.export", id: data!.id })
    if (!v.ok) throw new Error(v.error)
    const out = v.data as { options: { seconds: number }; index: string }
    expect(out.options.seconds).toBe(5)
    const json = out.index.match(/<script type="application\/json" id="dither-document">(.*?)<\/script>/s)?.[1] ?? ""
    expect(JSON.parse(json).artboards.map((x: { id: string }) => x.id)).toEqual([data!.id, ...ids])
    const longer = runCommand({ type: "video.export", id: data!.id, seconds: 9 })
    expect(longer.ok && (longer.data as { options: { seconds: number } }).options.seconds).toBe(9)
    expect(runCommand({ type: "code.get", id: data!.id })).toMatchObject({
      ok: true,
      data: { code: expect.stringContaining("A reel plays other frames") },
    })

    const patched = runCommand({
      type: "artboard.update",
      id: data!.id,
      patch: { widget: { clips: [{ id: ids[1], seconds: 1 }, "nope"] } },
    })
    expect(patched.ok).toBe(true)
    const reel = editor.artboards.find((x) => x.id === data!.id)
    if (reel?.widget?.kind !== "reel") throw new Error("unreachable")
    expect(reel.widget.clips).toEqual([
      { id: ids[1], seconds: 1, transition: { kind: "dissolve", seconds: 0.6, cell: 4, seed: null }, ...still },
    ])
    expect(runCommand({ type: "artboard.remove", id: ids[1] }).ok).toBe(true)
    expect(reel.widget.clips).toEqual([])
  })
})

describe("film", () => {
  it("takes a film from the protocol and exports it with its score", () => {
    const a = runCommand({ type: "component.add", is: "DitherBadge", name: "Badge" })
    const b = runCommand({ type: "chart.add", chart: "bar", name: "Bars" })
    if (!a.ok || !b.ok) throw new Error("setup")
    const ids = [(a.data as { id: string }).id, (b.data as { id: string }).id]
    const r = runCommand({
      type: "reel.add",
      name: "Film",
      clips: [
        { id: ids[0], seconds: 1, chapter: { line: "A badge.", spec: [["1", "badge"]] } },
        {
          id: ids[1],
          seconds: 1,
          camera: [
            { t: 0, zoom: 1 },
            { t: 1, zoom: 1.4 },
          ],
          callouts: [{ x: 0.3, y: 0.4, label: "Bars", note: "seeded", from: 0.2 }],
        },
      ],
      score: { seed: 3 },
    })
    if (!r.ok) throw new Error(r.error)
    const data = r.data as { id: string; clips: { camera: unknown[]; callouts: unknown[] }[]; score: unknown }
    expect(data.score).toEqual({ seed: 3 })
    expect(data.clips[1].camera).toEqual([
      { t: 0, x: 0.5, y: 0.5, zoom: 1, tilt: 0 },
      { t: 1, x: 0.5, y: 0.5, zoom: 1.4, tilt: 0 },
    ])
    expect(data.clips[1].callouts).toEqual([
      { x: 0.3, y: 0.4, label: "Bars", note: "seeded", side: "right", from: 0.2, to: 1 },
    ])
    expect(registrySchema().commands["reel.add"]).toContain("callouts")
    const reel = editor.artboards.find((x) => x.id === data.id)!
    expect(widgetCode(reel.widget!, { w: 100, h: 100 })).toContain('chapter "A badge."')
    expect(widgetCode(reel.widget!, { w: 100, h: 100 })).toContain("Score: synthesized from the cut, seed 3.")

    const v = runCommand({ type: "video.export", id: data.id })
    if (!v.ok) throw new Error(v.error)
    const out = v.data as { index: string; score?: { path: string; base64: string } }
    expect(out.index).toContain('<audio id="dither-score" src="./score.wav" data-start="0" data-duration="2"')
    expect(out.score?.path).toBe("score.wav")
    expect(atob(out.score!.base64).slice(0, 4)).toBe("RIFF")

    // Patching the score off leaves a silent reel: no audio track, no file.
    expect(runCommand({ type: "artboard.update", id: data.id, patch: { widget: { score: false } } }).ok).toBe(true)
    const silent = runCommand({ type: "video.export", id: data.id })
    if (!silent.ok) throw new Error(silent.error)
    expect((silent.data as { index: string }).index).not.toContain("<audio")
    expect((silent.data as { score?: unknown }).score).toBeUndefined()
  })
})
