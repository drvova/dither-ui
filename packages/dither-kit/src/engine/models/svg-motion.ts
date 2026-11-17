// An SVG's own animation (`svg.ts`): an element's SMIL `<animateMotion>`
// (along a path, turning with it under `rotate="auto"`) and
// `<animateTransform>` (translate, rotate, scale) become a world node's
// tracks, played on the kit clock as a VRML file's ROUTEs are. The page's y
// runs down and the world's up, so every matrix, key and centre is turned
// over on the way in.

import { addNode, type Track, type World } from "../world-scene"
import { mat4Identity, quatFromAxisAngle, type Mat4, type Quat, type Vec3 } from "../world-math"
import type { XmlEl } from "./x3d"
import { dist, flattenPath, IDENTITY, mul, nums, type Affine } from "./svg-path"

/** A 2D affine of the page as a matrix of the world (y turned over). */
export function worldMatrix([a, b, c, d, e, f]: Affine): Mat4 {
  const m = mat4Identity()
  m[0] = a
  m[1] = -b
  m[4] = -c
  m[5] = d
  m[12] = e
  m[13] = -f
  return m
}

/** A clock value in seconds: "2s", "350ms", "1.5", "0:01.5"; 0 when unreadable. */
export function clockSeconds(s: string | undefined): number {
  const v = s?.trim() ?? ""
  const parts = v.split(":")
  if (parts.length > 1) return parts.reduce((sum, p) => sum * 60 + (parseFloat(p) || 0), 0)
  const n = parseFloat(v)
  if (!Number.isFinite(n)) return 0
  return v.endsWith("ms") ? n / 1000 : v.endsWith("min") ? n * 60 : v.endsWith("h") ? n * 3600 : n
}

/** A rotation of the page by `deg` (clockwise as drawn) as the world's quaternion. */
const turn = (deg: number): Quat => quatFromAxisAngle([0, 0, 1], (-deg * Math.PI) / 180)

type Timing = { duration: number; loop: boolean; start: number }

function timing(el: XmlEl): Timing | null {
  const duration = clockSeconds(el.attrs.dur)
  if (!(duration > 0)) return null
  return { duration, loop: el.attrs.repeatCount === "indefinite", start: clockSeconds(el.attrs.begin) }
}

/** Key times in seconds: the element's `keyTimes`, else evenly spread. */
function keysOf(el: XmlEl, n: number, duration: number): number[] {
  const given = (el.attrs.keyTimes ?? "").split(";").map((k) => parseFloat(k))
  if (given.length === n && given.every(Number.isFinite)) return given.map((k) => k * duration)
  return Array.from({ length: n }, (_, k) => (n > 1 ? (k / (n - 1)) * duration : 0))
}

const track = (key: number[], value: number[], stride: 3 | 4, t: Timing): Track => ({
  key,
  value,
  stride,
  kind: stride === 4 ? "slerp" : "lerp",
  duration: t.duration,
  loop: t.loop,
  start: t.start,
})

/** Turns as quaternion keys, each long turn cut into steps under a quarter,
 * so slerp never takes the short way round a half turn or more. */
function turnKeys(key: number[], deg: number[]): { key: number[]; value: number[] } {
  const k: number[] = []
  const v: number[] = []
  for (let i = 0; i < deg.length; i++) {
    if (i > 0) {
      const cuts = Math.ceil(Math.abs(deg[i] - deg[i - 1]) / 90)
      for (let s = 1; s < cuts; s++) {
        k.push(key[i - 1] + ((key[i] - key[i - 1]) * s) / cuts)
        v.push(...turn(deg[i - 1] + ((deg[i] - deg[i - 1]) * s) / cuts))
      }
    }
    k.push(key[i])
    v.push(...turn(deg[i]))
  }
  return { key: k, value: v }
}

/** The motion along a path: positions paced by length, and with
 * `rotate="auto"` the heading of the path at each, unwound so it never
 * jumps a turn. */
function motionTracks(el: XmlEl, t: Timing, tol: number): WorldTracks {
  const d = el.attrs.path ?? (el.attrs.values ? `M${el.attrs.values.split(";").join("L")}` : "")
  const rings = flattenPath(d, tol)
  if (!rings.length) return {}
  const pts = rings[0].closed ? [...rings[0].ring, rings[0].ring[0]] : rings[0].ring
  const lengths = [0]
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + dist(pts[i - 1], pts[i]))
  const total = lengths[lengths.length - 1] || 1
  const key = lengths.map((l) => (l / total) * t.duration)
  const out: WorldTracks = {
    translation: track(
      key,
      pts.flatMap(([x, y]) => [x, -y, 0]),
      3,
      t,
    ),
  }
  const rotate = el.attrs.rotate
  if (rotate === "auto" || rotate === "auto-reverse") {
    const deg: number[] = []
    for (let i = 0; i < pts.length; i++) {
      const [a, b] = i + 1 < pts.length ? [pts[i], pts[i + 1]] : [pts[i - 1], pts[i]]
      let h = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + (rotate === "auto" ? 0 : 180)
      if (deg.length) h += Math.round((deg[deg.length - 1] - h) / 360) * 360
      deg.push(h)
    }
    const turns = turnKeys(key, deg)
    out.rotation = track(turns.key, turns.value, 4, t)
  } else if (rotate && Number.isFinite(parseFloat(rotate))) {
    out.rotation = track([0], [...turn(parseFloat(rotate))], 4, t)
  }
  return out
}

type WorldTracks = { translation?: Track; rotation?: Track; scale?: Track }

/** An `<animateTransform>`'s track, and the centre a rotation turns about. */
function transformTrack(el: XmlEl, t: Timing): { tracks: WorldTracks; center: Vec3 | null } {
  const values = (el.attrs.values ?? [el.attrs.from, el.attrs.to].filter(Boolean).join(";"))
    .split(";")
    .map((v) => nums(v))
    .filter((v) => v.length)
  if (!values.length) return { tracks: {}, center: null }
  const key = keysOf(el, values.length, t.duration)
  switch (el.attrs.type ?? "translate") {
    case "translate":
      return {
        tracks: {
          translation: track(
            key,
            values.flatMap(([x, y = 0]) => [x, -y, 0]),
            3,
            t,
          ),
        },
        center: null,
      }
    case "scale":
      return {
        tracks: {
          scale: track(
            key,
            values.flatMap(([x, y = x]) => [x, y, 1]),
            3,
            t,
          ),
        },
        center: null,
      }
    case "rotate": {
      const turns = turnKeys(
        key,
        values.map((v) => v[0]),
      )
      const [, cx = 0, cy = 0] = values[0]
      return { tracks: { rotation: track(turns.key, turns.value, 4, t) }, center: [cx, -cy, 0] }
    }
    default:
      return { tracks: {}, center: null }
  }
}

/**
 * The nodes an element's animations make, under `parent`: the motion
 * outermost (SVG lays it over the element's whole transform), then the
 * element's `transform` with its animated parts (summed onto it under
 * `additive="sum"`, in its place otherwise). `outer` is the matrix from
 * `parent`'s frame to the element's. Returns the node the element's own
 * shapes hang under, or null where it does not animate.
 */
export function animatedNode(world: World, el: XmlEl, outer: Affine, own: Affine, parent: number, tol: number) {
  const anims = el.children.filter((c) => c.name === "animateMotion" || c.name === "animateTransform")
  let node = parent
  let pre = outer
  let made = false
  const motion = anims.find((a) => a.name === "animateMotion")
  const motionTiming = motion && timing(motion)
  if (motion && motionTiming) {
    const tracks = motionTracks(motion, motionTiming, tol)
    if (tracks.translation) {
      node = addNode(world, { parent: node, pre: worldMatrix(pre), tracks })
      pre = IDENTITY
      made = true
    }
  }
  const tracks: WorldTracks = {}
  let center: Vec3 | null = null
  let replaces = false
  for (const a of anims) {
    if (a.name !== "animateTransform" || (a.attrs.attributeName ?? "transform") !== "transform") continue
    const t = timing(a)
    if (!t) continue
    const got = transformTrack(a, t)
    tracks.translation ??= got.tracks.translation
    tracks.rotation ??= got.tracks.rotation
    tracks.scale ??= got.tracks.scale
    center ??= got.center
    if (a.attrs.additive !== "sum") replaces = true
  }
  if (tracks.translation || tracks.rotation || tracks.scale) {
    // a rotation about a centre also carries its centre's shift, so the
    // animated transform is kept after the element's own unless it replaces it
    const before = replaces ? pre : mul(pre, own)
    node = addNode(world, { parent: node, pre: worldMatrix(before), tracks, center: center ?? [0, 0, 0] })
    return { node, local: IDENTITY }
  }
  return made ? { node, local: own } : null
}
