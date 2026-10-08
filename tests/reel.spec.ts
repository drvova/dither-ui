// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { createArtboard, normalizeArtboard } from "@/entities/artboard"
import { addArtboard, addReelArtboard, editor, removeArtboard } from "@/entities/editor"
import { createClip, createReel, widgetCode } from "@/entities/widget"
import { registrySchema, runCommand } from "@/features/agent"
import { defaultSeconds, reelClips } from "@/features/export-video"
import { reelAt, reelDuration, reelLoop, wipeDirectionOf } from "@/features/reel"
import { release, seek } from "../dither-kit/clock"

const clips = [createClip("a", 3), { ...createClip("b", 2), transition: { kind: "wipe-right" as const, seconds: 1, cell: 4, seed: null } }, { ...createClip("c", 1), transition: { kind: "cut" as const, seconds: 0.5, cell: 4, seed: null } }]

beforeEach(() => {
  editor.artboards = []
  editor.groups = []
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.viewport = { x: 0, y: 0, zoom: 1 }
})

describe("reel timeline", () => {
  it("lays clips end to end and resolves a moment to its clip, its outgoing clip and the eased progress", () => {
    expect(reelDuration(clips)).toBe(6)
    expect(reelAt([], 1)).toBeNull()
    // The first clip comes in over the background.
    expect(reelAt(clips, 0)).toEqual({ index: 0, local: 0, outgoing: null, progress: 0 })
    expect(reelAt(clips, 1)).toMatchObject({ index: 0, local: 1, outgoing: null, progress: 1 })
    const mid = reelAt(clips, 3.5)!
    expect(mid).toMatchObject({ index: 1, outgoing: 0 })
    expect(mid.local).toBeCloseTo(0.5)
    expect(mid.progress).toBeCloseTo(0.5)
    expect(reelAt(clips, 4.5)).toMatchObject({ index: 1, outgoing: null, progress: 1 })
    // A cut never overlaps.
    expect(reelAt(clips, 5.1)).toMatchObject({ index: 2, outgoing: null, progress: 1 })
    // Past the end holds the last clip; before the start is the first.
    expect(reelAt(clips, 99)).toMatchObject({ index: 2 })
    expect(reelAt(clips, -4)).toMatchObject({ index: 0 })
    expect(reelLoop(clips, 6.5)).toBeCloseTo(0.5)
    expect(reelLoop([], 3)).toBe(0)
    expect(["cut", "dissolve", "wipe-right", "wipe-left", "wipe-down", "wipe-up"].map((k) => wipeDirectionOf(k as never))).toEqual(["none", "none", "right", "left", "down", "up"])
  })
})

describe("reel model", () => {
  it("normalizes clips: junk out, self-references out, transitions clamped", () => {
    const a = createArtboard("button")
    a.widget = createReel(["x", a.id])
    a.widget.clips.push({ id: "y", seconds: 9999, transition: { kind: "spin" as never, seconds: 50, cell: 99, seed: "s" as never } }, "junk" as never, { seconds: 2 } as never)
    normalizeArtboard(a)
    if (a.widget?.kind !== "reel") throw new Error("unreachable")
    expect(a.widget.clips.map((c) => c.id)).toEqual(["x", "y"])
    expect(a.widget.clips[1]).toEqual({ id: "y", seconds: 600, transition: { kind: "dissolve", seconds: 50, cell: 16, seed: null } })
    const short = createArtboard("button")
    short.widget = { kind: "reel", clips: [{ id: "z", seconds: 0.5, transition: { kind: "wipe-up", seconds: 3, cell: 2, seed: 4 } }] }
    normalizeArtboard(short)
    if (short.widget?.kind !== "reel") throw new Error("unreachable")
    expect(short.widget.clips[0].transition).toEqual({ kind: "wipe-up", seconds: 0.5, cell: 2, seed: 4 })
    expect(widgetCode(short.widget, { w: 100, h: 100 })).toContain("z — 0.5s, in by wipe-up over 0.5s")
  })

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
    const r = runCommand({ type: "reel.add", name: "Cut", clips: [ids[0], { id: ids[1], seconds: 2, transition: { kind: "wipe-left", seconds: 0.5, cell: 8, seed: 3 } }, ids[0]], frame: { w: 640, h: 360 } })
    expect(r.ok).toBe(true)
    const data = r.ok ? (r.data as { id: string; kind: string; w: number; h: number; seconds: number; clips: unknown[] }) : null
    expect(data).toMatchObject({ kind: "reel", name: "Cut", w: 640, h: 360, seconds: 5 })
    expect(data?.clips).toEqual([
      { id: ids[0], seconds: 3, transition: { kind: "dissolve", seconds: 0.6, cell: 4, seed: null } },
      { id: ids[1], seconds: 2, transition: { kind: "wipe-left", seconds: 0.5, cell: 8, seed: 3 } },
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
    expect(runCommand({ type: "code.get", id: data!.id })).toMatchObject({ ok: true, data: { code: expect.stringContaining("A reel plays other frames") } })

    const patched = runCommand({ type: "artboard.update", id: data!.id, patch: { widget: { clips: [{ id: ids[1], seconds: 1 }, "nope"] } } })
    expect(patched.ok).toBe(true)
    const reel = editor.artboards.find((x) => x.id === data!.id)
    if (reel?.widget?.kind !== "reel") throw new Error("unreachable")
    expect(reel.widget.clips).toEqual([{ id: ids[1], seconds: 1, transition: { kind: "dissolve", seconds: 0.6, cell: 4, seed: null } }])
    expect(runCommand({ type: "artboard.remove", id: ids[1] }).ok).toBe(true)
    expect(reel.widget.clips).toEqual([])
  })
})

describe("reel renderer", () => {
  let queue = new Map<number, FrameRequestCallback>()
  /** Every queued frame (the reel's and the clips' surfaces') runs at `t`. */
  const flush = (t: number) => {
    const batch = [...queue.values()]
    queue.clear()
    for (const cb of batch) cb(t)
  }
  beforeEach(() => {
    queue = new Map()
    let nextId = 1
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextId++
      queue.set(id, cb)
      return id
    })
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      queue.delete(id)
    })
    vi.stubGlobal("IntersectionObserver", undefined)
  })
  afterEach(() => {
    release()
    vi.unstubAllGlobals()
  })

  // Mounts the Studio's widget renderer (the whole kit) — integration-scale budget.
  it("cuts between frames on the kit clock, keeping each clip's element while it is on screen", { timeout: 30000 }, async () => {
    const { ReelRenderer } = await import("@/widgets/reel-renderer")
    const a = addArtboard("button")
    const b = addArtboard("button")
    const reel = addReelArtboard([a.id, b.id])
    if (reel.widget?.kind !== "reel") throw new Error("unreachable")
    reel.widget.clips[1].transition = { kind: "wipe-right", seconds: 1, cell: 4, seed: null }
    const w = mount(ReelRenderer, { props: { reel: reel.widget, artboardId: reel.id } })
    const layers = () => w.findAll("[data-reel-layer]").map((l) => `${l.attributes("data-reel-layer")}:${l.attributes("data-reveal")}`)
    seek(1000)
    await nextTick()
    expect(w.attributes("data-reel-clip")).toBe("0")
    expect(layers()).toEqual(["0:shown"])
    const first = w.find("[data-reel-layer='0']").element
    seek(3500)
    await nextTick()
    expect(w.attributes("data-reel-clip")).toBe("1")
    expect(layers()).toEqual(["0:shown", "1:playing"])
    expect(w.find("[data-reel-layer='0']").element).toBe(first)
    expect(w.findAll("[data-clip]").map((c) => c.attributes("data-clip"))).toEqual([a.id, b.id])
    seek(4500)
    await nextTick()
    expect(layers()).toEqual(["1:shown"])
    // Directed time is held past the end rather than looped.
    seek(60000)
    await nextTick()
    expect(w.attributes("data-reel-clip")).toBe("1")
    // Free-running, the loop wraps.
    release()
    await nextTick()
    flush(100000)
    flush(100050)
    await nextTick()
    expect(Number(w.attributes("data-reel-time"))).toBeCloseTo(0.05)
    w.unmount()
  })
})
