// Node-side only — see kit-dither.ts. The reel film: a strip of frames
// running past an ember playhead, each frame one moment of a ball's bounce,
// so the strip itself is the animation it carries — what the video export
// does to a Studio frame. Two far strips, smaller and slower, thread the
// other way above and below it. Every strip moves exactly one bounce (six
// frames) per loop, so the last frame is the first. Verb: run. Geometry:
// frames and sprockets.
import { base, constant, fill, keyed, marker, parallaxLayersMacro, type PathContour } from "@clayzo/animation/authoring"
import { at, pixelFilm, rect, type Nodes } from "./frame"
import { heat, tone } from "./kit-dither"

const W = 960
const H = 600
const END = at(4.8)
/** Frame pitch along the strip, and how many frames one bounce takes. */
const PITCH = 252
const BOUNCE = 6
const FW = 216
const FH = 228
const TOP = (H - FH) / 2

/** The ball's height in frame k of a bounce, 0 at the floor, 1 at the apex. */
const height = (k: number) => {
  const p = ((k % BOUNCE) + BOUNCE) % BOUNCE
  const t = (p + 0.5) / BOUNCE
  return 1 - (2 * t - 1) ** 2
}

/** One strip, in its own space (frame tops at y 0): frames from just left
 * of the canvas to a full bounce past its right edge, so it covers the
 * canvas through its whole run; sprockets along both edges, four a frame.
 * The group runs one bounce a loop — `dir` -1 leftward, 1 rightward — so
 * its last frame is its first. */
function strip(nodes: Nodes, id: string, y: number, k: number, dir: 1 | -1, tones: { frame: number; floor: number; ball: number; hole: number }) {
  const first = -1
  const count = Math.ceil(W / k / PITCH) + BOUNCE + 2
  const frames: PathContour[] = []
  const floors: PathContour[] = []
  const balls: PathContour[] = []
  const holes: PathContour[] = []
  for (let f = first; f < first + count; f++) {
    const x = f * PITCH + (PITCH - FW) / 2
    frames.push(rect(x, 0, FW, FH))
    floors.push(rect(x + 24, FH - 44, FW - 48, 12))
    const d = 48
    balls.push(rect(x + FW / 2 - d / 2, FH - 44 - d - height(f) * (FH - 120), d, d))
  }
  // Holes smaller than a cell would alias to noise, so a far strip has none.
  if (tones.hole > 0) {
    for (let x = first * PITCH; x < (first + count) * PITCH; x += PITCH / 4) {
      holes.push(rect(x + 18, -52, 28, 24), rect(x + 18, FH + 28, 28, 24))
    }
  }
  const part = (name: string, contours: PathContour[], t: number) => {
    nodes[`${id}.${name}`] = { ...base(`${id}.${name}`, { outTick: END }), type: "path", path: constant({ contours }), style: { fill: fill(tone(t)) } }
    return `${id}.${name}`
  }
  // Leftward strips start at 0 and run a bounce left; rightward ones start
  // a bounce left and run back to 0.
  const from = dir < 0 ? 0 : -BOUNCE * PITCH
  nodes[`${id}.run`] = {
    ...base(`${id}.run`, {
      outTick: END,
      position: keyed(`${id}.position`, [
        [0, { x: from, y: 0, z: 0 }, "linear"],
        [END, { x: from + dir * BOUNCE * PITCH, y: 0, z: 0 }],
      ]),
    }),
    type: "group",
    children: [
      part("frames", frames, tones.frame),
      part("floors", floors, tones.floor),
      part("balls", balls, tones.ball),
      ...(holes.length ? [part("holes", holes, tones.hole)] : []),
    ],
  }
  nodes[id] = { ...base(id, { outTick: END, x: 0, y, scale: k }), type: "group", children: [`${id}.run`] }
  return id
}

export function reelFilm() {
  const nodes: Nodes = {}
  // Two far strips, smaller and dimmer, running at their own pace — one
  // over the band, one under it the other way, like film threading a
  // projector — then the near strip in the band.
  const far = [
    strip(nodes, "far.top", 24, 0.34, -1, { frame: 0.165, floor: 0.3, ball: 0.62, hole: 0 }),
    strip(nodes, "far.low", H - 24 - FH * 0.34, 0.34, 1, { frame: 0.165, floor: 0.3, ball: 0.62, hole: 0 }),
  ]
  const near = strip(nodes, "film", TOP, 1, -1, { frame: 0.17, floor: 0.36, ball: 0.86, hole: 0.3 })
  // The band the strip runs in, and the ember playhead over the centre frame.
  nodes.band = {
    ...base("band", { outTick: END, x: W / 2, y: H / 2 }),
    type: "rect",
    size: constant({ width: W + 48, height: FH + 120 }),
    cornerRadius: constant(0),
    style: { fill: fill(tone(0.05)) },
  }
  nodes.head = {
    ...base("head", { outTick: END }),
    type: "path",
    path: constant({ contours: [rect(W / 2 - 6, TOP - 84, 12, FH + 168), rect(W / 2 - 24, TOP - 96, 48, 24)] }),
    style: { fill: fill(heat(0.55)) },
  }
  return pixelFilm({
    id: "reel",
    name: "dither-ui reel",
    width: W,
    height: H,
    end: END,
    nodes,
    scene: [...far, "band", near, "head"],
    cell: 12,
    markers: [marker("still", 0)],
    loupe: 9 * 12,
    // The far strips drift less than the near one under the cursor.
    interaction: [parallaxLayersMacro({ nodeIds: [...far, near], span: 900, reach: 18 })],
  })
}
