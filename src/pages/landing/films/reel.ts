// Node-side only — see kit-dither.ts. The reel film: a strip of frames
// running past an ember playhead, each frame one moment of a ball's bounce,
// so the strip itself is the animation it carries — what the video export
// does to a Studio frame. The strip moves exactly one bounce (six frames)
// per loop, so the last frame is the first. Verb: run. Geometry: frames
// and sprockets.
import { base, constant, fill, keyed, marker, type PathContour } from "@clayzo/animation/authoring"
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

export function reelFilm() {
  const nodes: Nodes = {}
  // Frames from just left of the canvas to a full bounce past its right
  // edge, so the strip covers the canvas through its whole run.
  const first = -1
  const count = Math.ceil(W / PITCH) + BOUNCE + 2
  const frames: PathContour[] = []
  const floors: PathContour[] = []
  const balls: PathContour[] = []
  const holes: PathContour[] = []
  for (let k = first; k < first + count; k++) {
    const x = k * PITCH + (PITCH - FW) / 2
    frames.push(rect(x, TOP, FW, FH))
    floors.push(rect(x + 24, TOP + FH - 44, FW - 48, 12))
    const d = 48
    balls.push(rect(x + FW / 2 - d / 2, TOP + FH - 44 - d - height(k) * (FH - 120), d, d))
  }
  // Sprockets: two rows of holes along the strip's edges, four per frame.
  for (let x = first * PITCH; x < (first + count) * PITCH; x += PITCH / 4) {
    holes.push(rect(x + 18, TOP - 52, 28, 24), rect(x + 18, TOP + FH + 28, 28, 24))
  }
  const strip = (id: string, contours: PathContour[], t: number, hot = false) => {
    nodes[id] = { ...base(id, { outTick: END }), type: "path", path: constant({ contours }), style: { fill: fill(hot ? heat(t) : tone(t)) } }
    return id
  }
  nodes.film = {
    ...base("film", {
      outTick: END,
      position: keyed("film.position", [
        [0, { x: 0, y: 0, z: 0 }, "linear"],
        [END, { x: -BOUNCE * PITCH, y: 0, z: 0 }],
      ]),
    }),
    type: "group",
    children: [strip("frames", frames, 0.17), strip("floors", floors, 0.36), strip("balls", balls, 0.86), strip("holes", holes, 0.3)],
  }
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
    scene: ["band", "film", "head"],
    cell: 12,
    markers: [marker("still", 0)],
  })
}
