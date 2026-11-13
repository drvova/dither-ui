// @rstest-environment jsdom
import { describe, expect, it } from "rstack/test"
import { createArtboard, normalizeArtboard } from "@/entities/artboard"
import { createClip, createReel } from "@/entities/widget"
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

const clips = [
  createClip("a", 3),
  { ...createClip("b", 2), transition: { kind: "wipe-right" as const, seconds: 1, cell: 4, seed: null } },
  { ...createClip("c", 1), transition: { kind: "cut" as const, seconds: 0.5, cell: 4, seed: null } },
]

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
      { id: "y", seconds: 9999, transition: { kind: "spin", seconds: 50, cell: 99, seed: "s" } } as never,
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
    } as unknown as typeof short.widget
    normalizeArtboard(short)
    if (short.widget?.kind !== "reel") throw new Error("unreachable")
    expect(short.widget.clips[0].transition).toEqual({ kind: "wipe-up", seconds: 0.5, cell: 2, seed: 4 })
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
    blank.widget = {
      kind: "reel",
      clips: [{ id: "z", seconds: 2, chapter: { line: "   " } }],
    } as unknown as typeof blank.widget
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
})
