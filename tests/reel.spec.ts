// @rstest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import { createArtboard, normalizeArtboard } from "@/entities/artboard"
import { addArtboard, addReelArtboard, editor, removeArtboard } from "@/entities/editor"
import { createClip, createReel, widgetCode } from "@/entities/widget"
import { addLaunchFilm, registrySchema, runCommand } from "@/features/agent"
import { defaultSeconds, reelClips } from "@/features/export-video"
import {
  CAMERA_MOVES,
  cameraAt,
  cameraMoveOf,
  cameraPoint,
  cameraTransform,
  calloutsAt,
  chapterAt,
  reelAt,
  reelDuration,
  reelLoop,
  scorePlanOf,
  wipeDirectionOf,
} from "@/features/reel"
import { release, seek } from "../dither-kit/engine/clock"

const clips = [
  createClip("a", 3),
  { ...createClip("b", 2), transition: { kind: "wipe-right" as const, seconds: 1, cell: 4, seed: null } },
  { ...createClip("c", 1), transition: { kind: "cut" as const, seconds: 0.5, cell: 4, seed: null } },
]

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
    expect(
      ["cut", "dissolve", "wipe-right", "wipe-left", "wipe-down", "wipe-up"].map((k) => wipeDirectionOf(k as never)),
    ).toEqual(["none", "none", "right", "left", "down", "up"])
  })
})

describe("reel model", () => {
  it("normalizes clips: junk out, self-references out, transitions clamped", () => {
    const a = createArtboard("button")
    a.widget = createReel(["x", a.id])
    a.widget.clips.push(
      { id: "y", seconds: 9999, transition: { kind: "spin" as never, seconds: 50, cell: 99, seed: "s" as never } },
      "junk" as never,
      { seconds: 2 } as never,
    )
    normalizeArtboard(a)
    if (a.widget?.kind !== "reel") throw new Error("unreachable")
    expect(a.widget.clips.map((c) => c.id)).toEqual(["x", "y"])
    expect(a.widget.clips[1]).toEqual({
      id: "y",
      seconds: 600,
      transition: { kind: "dissolve", seconds: 50, cell: 16, seed: null },
      camera: [],
      callouts: [],
      chapter: null,
    })
    // A reel from before films: no camera, callouts, chapter or score.
    const short = createArtboard("button")
    short.widget = {
      kind: "reel",
      clips: [{ id: "z", seconds: 0.5, transition: { kind: "wipe-up", seconds: 3, cell: 2, seed: 4 } }],
    } as never
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
  it("sanitizes camera keys, callouts, chapters and the score, and fills reels from before films", () => {
    const a = createArtboard("button")
    a.widget = createReel(["x"])
    const clip = a.widget.clips[0] as unknown as Record<string, unknown>
    clip.camera = [{ t: 2, x: -1, zoom: 99, tilt: "lean" }, { t: 0.2, x: 0.3, y: 0.4, zoom: 1.5, tilt: -45 }, "junk"]
    clip.callouts = [
      { x: 2, y: 0.5, label: "  glTF, OBJ\u0007  ", note: 4, side: "up", from: -3, to: 99 },
      { label: "" },
      { label: "x".repeat(99), from: 2, to: 1 },
    ]
    clip.chapter = { line: "Every docs section runs live.", spec: [["302", "live sections"], ["", ""], "junk", ["0"]] }
    ;(a.widget as unknown as Record<string, unknown>).score = { seed: 4.6 }
    normalizeArtboard(a)
    if (a.widget?.kind !== "reel") throw new Error("unreachable")
    const c = a.widget.clips[0]
    expect(c.camera).toEqual([
      { t: 0.2, x: 0.3, y: 0.4, zoom: 1.5, tilt: -30 },
      { t: 1, x: 0, y: 0.5, zoom: 8, tilt: 0 },
    ])
    expect(c.callouts).toEqual([
      { x: 1, y: 0.5, label: "glTF, OBJ", note: "", side: "right", from: 0, to: 3 },
      { x: 0.5, y: 0.5, label: "x".repeat(48), note: "", side: "right", from: 2, to: 2 },
    ])
    expect(c.chapter).toEqual({
      line: "Every docs section runs live.",
      spec: [
        ["302", "live sections"],
        ["0", ""],
      ],
    })
    expect(a.widget.score).toEqual({ seed: 5 })
    const blank = createArtboard("button")
    blank.widget = { kind: "reel", clips: [{ id: "z", seconds: 2, chapter: { line: "   " } }] } as never
    normalizeArtboard(blank)
    if (blank.widget?.kind !== "reel") throw new Error("unreachable")
    expect(blank.widget.score).toBeNull()
    expect(blank.widget.clips[0]).toMatchObject({ camera: [], callouts: [], chapter: null })
  })

  it("moves the camera between eased keys and places a frame's point through it", () => {
    const keys = CAMERA_MOVES["pan right"]
    expect(cameraAt([], 0.5)).toEqual({ x: 0.5, y: 0.5, zoom: 1, tilt: 0 })
    expect(cameraAt(keys, -1)).toEqual(cameraAt(keys, 0))
    expect(cameraAt(keys, 0)).toMatchObject({ x: 0.4, tilt: -4 })
    expect(cameraAt(keys, 0.5).x).toBeCloseTo(0.5)
    expect(cameraAt(keys, 1)).toMatchObject({ x: 0.6, tilt: 4 })
    expect(cameraMoveOf(keys)).toBe("pan right")
    expect(cameraMoveOf([])).toBe("still")
    expect(cameraMoveOf([{ t: 0, x: 0.1, y: 0.1, zoom: 2, tilt: 0 }])).toBe("custom")
    // The look point lands on the stage's centre; zoom scales what is around it.
    const cam = { x: 0.25, y: 0.5, zoom: 2, tilt: 0 }
    expect(cameraPoint(cam, 400, 200, 1000, 0.25, 0.5)).toEqual([0, 0])
    expect(cameraPoint(cam, 400, 200, 1000, 0.5, 0.75)).toEqual([200, 100])
    expect(cameraTransform(cam, 400, 200, 1000)).toBe(
      "perspective(1000px) rotateY(0deg) translate(200px, 0px) scale(2)",
    )
    // A lean brings the near side closer: its points spread, the far side's gather.
    const leaned = { x: 0.5, y: 0.5, zoom: 1, tilt: 20 }
    const [right] = cameraPoint(leaned, 400, 200, 1000, 1, 0.5)
    const [left] = cameraPoint(leaned, 400, 200, 1000, 0, 0.5)
    expect(Math.abs(left)).toBeGreaterThan(Math.abs(right))
  })

  it("draws callouts in, fades them out, and turns chapters with the clip that sets them", () => {
    const clip = {
      ...createClip("a", 4),
      callouts: [{ x: 0.5, y: 0.5, label: "One", note: "", side: "right" as const, from: 1, to: 3 }],
    }
    expect(calloutsAt(clip, 0.5)).toEqual([])
    expect(calloutsAt(clip, 1.45)[0]).toMatchObject({ label: "One", fade: 1 })
    expect(calloutsAt(clip, 1.45)[0].drawn).toBeCloseTo(0.5)
    expect(calloutsAt(clip, 2.85)[0].fade).toBeCloseTo(0.5)
    expect(calloutsAt(clip, 3.1)).toEqual([])
    const first = { line: "First", spec: [] }
    const second = { line: "Second", spec: [["2", "rows"]] as [string, string][] }
    const film = [
      { ...createClip("a", 2), chapter: first },
      createClip("b", 2),
      { ...createClip("c", 2), chapter: second },
    ]
    expect(chapterAt([createClip("a")], reelAt([createClip("a")], 1))).toBeNull()
    expect(chapterAt(film, reelAt(film, 0.1))).toMatchObject({ chapter: first, previous: null })
    expect(chapterAt(film, reelAt(film, 3))).toEqual({ chapter: first, previous: null, progress: 1 })
    const turning = chapterAt(film, reelAt(film, 4.25))!
    expect(turning).toMatchObject({ chapter: second, previous: first })
    expect(turning.progress).toBeCloseTo(0.5)
    expect(chapterAt(film, reelAt(film, 5.5))!.progress).toBe(1)
  })

  it("reads the cut as the score's plan", () => {
    const reel = createReel(["a", "b", "c"])
    reel.clips[1].chapter = { line: "Two", spec: [] }
    reel.clips[2].callouts = [{ x: 0.5, y: 0.5, label: "Tick", note: "", side: "left", from: 0.5, to: 2 }]
    reel.score = { seed: 9 }
    expect(scorePlanOf(reel)).toEqual({ seconds: 9, clips: [0, 3, 6], marks: [3.1], ticks: [6.5], seed: 9 })
    expect(scorePlanOf(reel, 12).seconds).toBe(12)
  })

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

describe("launch film", () => {
  it("builds the kit's frames into a film with chapters and a score, its frames in a row under it", () => {
    const id = addLaunchFilm()
    const film = editor.artboards.find((a) => a.id === id)
    if (film?.widget?.kind !== "reel") throw new Error("no film")
    expect(editor.artboards).toHaveLength(6)
    expect(film.widget.clips).toHaveLength(5)
    expect(film.widget.clips.every((c) => c.chapter)).toBe(true)
    expect(film.widget.clips.filter((c) => c.camera.length === 2)).toHaveLength(5)
    expect(film.widget.score).toEqual({ seed: 7 })
    expect(reelDuration(film.widget.clips)).toBe(21)
    expect([film.w, film.h]).toEqual([960, 540])
    expect(editor.selectedArtboardId).toBe(id)
    const frames = editor.artboards.filter((a) => a.id !== id)
    expect(new Set(frames.map((f) => f.y)).size).toBe(1)
    expect(frames[0].y).toBeGreaterThan(film.y + film.h)
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
    rs.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextId++
      queue.set(id, cb)
      return id
    })
    rs.stubGlobal("cancelAnimationFrame", (id: number) => {
      queue.delete(id)
    })
    rs.stubGlobal("IntersectionObserver", undefined)
  })
  afterEach(() => {
    release()
    rs.unstubAllGlobals()
  })

  // Mounts the Studio's widget renderer (the whole kit) — integration-scale budget.
  it(
    "cuts between frames on the kit clock, keeping each clip's element while it is on screen",
    { timeout: 30000 },
    async () => {
      const { ReelRenderer } = await import("@/widgets/reel-renderer")
      const a = addArtboard("button")
      const b = addArtboard("button")
      const reel = addReelArtboard([a.id, b.id])
      if (reel.widget?.kind !== "reel") throw new Error("unreachable")
      reel.widget.clips[1].transition = { kind: "wipe-right", seconds: 1, cell: 4, seed: null }
      const w = mount(ReelRenderer, { props: { reel: reel.widget, artboardId: reel.id } })
      const layers = () =>
        w.findAll("[data-reel-layer]").map((l) => `${l.attributes("data-reel-layer")}:${l.attributes("data-reveal")}`)
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
    },
  )

  it("moves each clip by its camera, draws its callouts and keeps the chapter band", { timeout: 30000 }, async () => {
    // The stage measures 640 x 360: callouts are placed in its pixels.
    rs.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private cb: ResizeObserverCallback) {}
        observe() {
          this.cb([{ contentRect: { width: 640, height: 360 } } as ResizeObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    const { ReelRenderer } = await import("@/widgets/reel-renderer")
    const a = addArtboard("button")
    const b = addArtboard("button")
    const reel = addReelArtboard([a.id, b.id])
    if (reel.widget?.kind !== "reel") throw new Error("unreachable")
    reel.widget.clips[0].camera = CAMERA_MOVES["push in"].map((k) => ({ ...k }))
    reel.widget.clips[0].callouts = [
      { x: 0.5, y: 0.5, label: "A button", note: "seeded", side: "right", from: 1, to: 3 },
    ]
    reel.widget.clips[0].chapter = { line: "One frame.", spec: [["1", "button"]] }
    reel.widget.clips[1].chapter = { line: "Another frame.", spec: [] }
    const w = mount(ReelRenderer, { props: { reel: reel.widget, artboardId: reel.id } })
    const camera = () => w.find("[data-reel-camera]").attributes("style") ?? ""
    seek(0)
    await nextTick()
    expect(camera()).toContain("scale(1)")
    expect(w.find("[data-reel-callout]").exists()).toBe(false)
    expect(w.find("[data-reel-chapter]").attributes("data-reel-chapter")).toBe("One frame.")
    seek(2000)
    await nextTick()
    expect(camera()).not.toContain("scale(1)")
    expect(w.find("[data-reel-callout]").attributes("data-reel-callout")).toBe("A button")
    seek(5000)
    await nextTick()
    expect(w.find("[data-reel-callout]").exists()).toBe(false)
    expect(w.find("[data-reel-chapter]").attributes("data-reel-chapter")).toBe("Another frame.")
    w.unmount()
  })
})
