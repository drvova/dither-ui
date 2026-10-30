// The kit's claims as checks: each states what it claims, how it is measured
// and against what, then measures it with the kit's own engine, pure and in a
// few milliseconds. The Verification section runs them in the reader's
// browser; CI runs the same checks in Node (tests/lab.spec.ts), and each
// names the spec that holds its claim in depth.
import { resolveSample, sampleKeyframes, type KeyframeTrack } from "@dither-kit/engine/keyframes"
import { MODEL_FORMATS, type ModelFormat, parseWorld } from "@dither-kit/engine/models"
import { BAYER4, fnv1a, SCREEN_KINDS, SCREENS } from "@dither-kit/engine/pixel"
import { paintPoster, posterLayout, type PosterParams } from "@dither-kit/engine/poster"
import { createRasterBuffer } from "@dither-kit/engine/raster"
import { BAYER8, wipeStyle } from "@dither-kit/engine/wipe"
import { paintWorld, type WorldStyle, type WorldView } from "@dither-kit/engine/world"

export type Reading = { holds: boolean; figure: string }

export type Check = {
  id: string
  claim: string
  method: string
  against: string
  /** The spec that holds the claim in CI, from the repository root. */
  test: `tests/${string}.spec.ts`
  run: () => Reading
}

const count = (n: number) => n.toLocaleString("en-US")
const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
  let n = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++
  return n
}

// The poster at seed 5: inks, screen and size fixed here, so its bytes are
// a constant of the kit's arithmetic alone.
const POSTER: PosterParams = {
  inks: [
    [64, 120, 255],
    [255, 150, 50],
    [228, 225, 216],
  ],
  ground: null,
  screen: "bayer",
  speed: 1.5,
}
const print = (time: number) => {
  const buffer = createRasterBuffer(96, 120)
  paintPoster(buffer, posterLayout(5, POSTER.inks.length), POSTER, time)
  return buffer.data
}
/** The print's bytes through the kit's own FNV-1a. */
export const hashOf = (bytes: Uint8ClampedArray) => {
  let text = ""
  for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i])
  return fnv1a(text).toString(16).padStart(8, "0")
}
/** The hash of the poster at 2.4 s as CI computes it in Node; tests/lab.spec.ts pins it. */
export const POSTER_HASH = "c8364f4f"

const size = `${SCREENS.bayer.length}×${SCREENS.bayer[0].length}`
const tones = SCREENS.bayer.length * SCREENS.bayer[0].length + 1

const BOX = "#VRML V2.0 utf8\nShape { geometry Box { size 2 1 1 } }"
const VIEW: WorldView = { yaw: 30, pitch: 20, zoom: 1, fov: 40, time: 0 }
const STYLE: WorldStyle = { fill: [228, 225, 216], matrix: BAYER4, shade: 0.2, material: false, wire: false, fog: 0 }
const render = (view: WorldView) => {
  const buffer = createRasterBuffer(64, 48)
  paintWorld(buffer, parseWorld(BOX, "vrml"), view, STYLE)
  return buffer.data
}

// Container units, percentages by axis and a custom length, between two keys.
const TRACK: KeyframeTrack = {
  duration: 2,
  keyframes: [
    { x: "0cqw", y: "10cqh", left: "25%", top: "30%", inset: "4cqmin" },
    { x: "40cqw", y: "-5cqh", left: "60%", top: "5%", inset: "12cqmax" },
  ],
}

const steps = BAYER8.length * BAYER8[0].length
const rectsOf = (image: string) =>
  new Set(decodeURIComponent(image.slice(image.indexOf(",") + 1, -2)).match(/<rect [^>]*>/g) ?? [])

/** One triangle in every format the kit reads. */
const triangle = (): Record<ModelFormat, string> => {
  const bytes = new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer)
  const gltf = {
    asset: { version: "2.0" },
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`, byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }],
  }
  return {
    vrml: "#VRML V2.0 utf8\nShape { geometry IndexedFaceSet { coord Coordinate { point [0 0 0, 1 0 0, 0 1 0] } coordIndex [0 1 2 -1] } }",
    x3d: '<X3D><Scene><Shape><IndexedFaceSet coordIndex="0 1 2 -1"><Coordinate point="0 0 0 1 0 0 0 1 0"/></IndexedFaceSet></Shape></Scene></X3D>',
    obj: "v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n",
    stl: "solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid t\n",
    ply: "ply\nformat ascii 1.0\nelement vertex 3\nproperty float x\nproperty float y\nproperty float z\nelement face 1\nproperty list uchar int vertex_indices\nend_header\n0 0 0\n1 0 0\n0 1 0\n3 0 1 2\n",
    off: "OFF\n3 1 0\n0 0 0\n1 0 0\n0 1 0\n3 0 1 2\n",
    gltf: JSON.stringify(gltf),
  }
}

export const CHECKS: readonly Check[] = [
  {
    id: "repeat",
    claim: "Same seed, same moment, same bytes",
    method:
      "The poster is printed twice at seed 5 and 2.4\u00a0s and every byte compared; printed again at 3.4\u00a0s, the control must differ.",
    against: "0 bytes differ",
    test: "tests/poster.spec.ts",
    run: () => {
      const a = print(2.4)
      const n = differ(a, print(2.4))
      const control = differ(a, print(3.4))
      return {
        holds: n === 0 && control > 0,
        figure: control ? `${count(n)} of ${count(a.length)} differ` : "the control matched",
      }
    },
  },
  {
    id: "portable",
    claim: "The same bytes in every engine",
    method:
      "The same print is hashed through the kit's FNV-1a and set beside the hash CI recorded running the kit in Node.",
    against: `hash ${POSTER_HASH}`,
    test: "tests/lab.spec.ts",
    run: () => {
      const hash = hashOf(print(2.4))
      return { holds: hash === POSTER_HASH, figure: `hash ${hash}` }
    },
  },
  {
    id: "tones",
    claim: `Every screen prints ${tones} tones`,
    method: `A ${size} block is printed at each of ${tones} even tone steps through each screen and its lit cells counted.`,
    against: "step k lights k cells",
    test: "tests/screens.spec.ts",
    run: () => {
      const good = SCREEN_KINDS.filter((kind) => {
        const thresholds = SCREENS[kind].flat()
        for (let k = 0; k < tones; k++) if (thresholds.filter((t) => k / (tones - 1) > t).length !== k) return false
        return true
      }).length
      return { holds: good === SCREEN_KINDS.length, figure: `${good} of ${SCREEN_KINDS.length} screens` }
    },
  },
  {
    id: "world",
    claim: "The 3D engine repeats itself byte for byte",
    method:
      "A box read from a VRML file is rasterized twice on the CPU at one view and every byte compared; turned 15°, the control must differ.",
    against: "0 bytes differ",
    test: "tests/world.spec.ts",
    run: () => {
      const a = render(VIEW)
      const n = differ(a, render(VIEW))
      const control = differ(a, render({ ...VIEW, yaw: VIEW.yaw + 15 }))
      return {
        holds: n === 0 && control > 0,
        figure: control ? `${count(n)} of ${count(a.length)} differ` : "the control matched",
      }
    },
  },
  {
    id: "scale",
    claim: "A scene scales exactly with its box",
    method:
      "A track of container units and percentages is sampled at 0.7\u00a0s and resolved in a 320 by 180 box, then in one twice that size.",
    against: "every length doubles",
    test: "tests/keyframes.spec.ts",
    run: () => {
      const sample = sampleKeyframes(TRACK, 0.7)
      const small = resolveSample(sample, { width: 320, height: 180 })
      const large = resolveSample(sample, { width: 640, height: 360 })
      const names = Object.keys(sample.lengths)
      const doubled = names.filter((n) => large[n] === 2 * small[n]).length
      return { holds: names.length > 0 && doubled === names.length, figure: `${doubled} of ${names.length} doubled` }
    },
  },
  {
    id: "wipe",
    claim: "A wipe shows one more cell per step",
    method: `The dissolve's mask is drawn at each of the ${steps} steps of its ${BAYER8.length}×${BAYER8[0].length} matrix and its shown cells compared step to step.`,
    against: "one more each step",
    test: "tests/wipe.spec.ts",
    run: () => {
      let shown = new Set<string>()
      let good = 0
      for (let k = 1; k <= steps; k++) {
        const style = wipeStyle(k / steps + 1e-6, { cell: 4 })
        // No mask is every cell shown.
        const next = style ? rectsOf(style.image) : null
        const size = next ? next.size : steps
        if (size === k && [...shown].every((r) => !next || next.has(r))) good++
        shown = next ?? shown
      }
      return { holds: good === steps, figure: `${good} of ${steps} steps` }
    },
  },
  {
    id: "formats",
    claim: `${MODEL_FORMATS.length} model formats read in the page`,
    method: "A triangle written in each format is parsed by the kit's own readers, here, with nothing fetched.",
    against: "a triangle from each",
    test: "tests/models.spec.ts",
    run: () => {
      const files = triangle()
      const read = MODEL_FORMATS.filter((f) => parseWorld(files[f], f).meshes.some((m) => m.indices.length >= 3)).length
      return { holds: read === MODEL_FORMATS.length, figure: `${read} of ${MODEL_FORMATS.length} formats` }
    },
  },
]

/** The browser engine a user agent names, the lab's one condition. */
export function engineOf(userAgent: string): string {
  if (/Firefox\//.test(userAgent)) return "Gecko"
  if (/Chrom(?:e|ium)\/|Edg\//.test(userAgent)) return "Chromium"
  if (/AppleWebKit\//.test(userAgent)) return "WebKit"
  return "this browser"
}
