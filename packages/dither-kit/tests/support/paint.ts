// A 2D canvas that remembers what it shows: every context call since the
// canvas was last wiped (a resize, a clear or an upload over the whole
// canvas) is its paint, uploads by the bytes they carry and every stroke
// with the state it reads (fill, alpha, line, font), so two canvases that
// show the same thing read the same. What the paint-law specs compare
// a surface updated in place with one mounted fresh by.

/** FNV-1a over RGBA pixels, a clear pixel as clear whatever colour it
 * kept: an upload's content in a few characters. */
function hash(bytes: ArrayLike<number>): string {
  let h = 0x811c9dc5
  for (let i = 0; i < bytes.length; i += 4) {
    const clear = bytes[i + 3] === 0
    for (let k = 0; k < 4; k++) h = Math.imul(h ^ (clear ? 0 : bytes[i + k]!), 0x01000193)
  }
  return `${bytes.length}:${(h >>> 0).toString(36)}`
}

type Canvas = HTMLCanvasElement
const paints = new WeakMap<Canvas, string[]>()
const opsOf = (canvas: Canvas) => {
  let ops = paints.get(canvas)
  if (!ops) paints.set(canvas, (ops = []))
  return ops
}

/** What a canvas shows now: its size and every call since it was last wiped. */
export const paintOf = (canvas: Canvas): string => `${canvas.width}x${canvas.height}|${opsOf(canvas).join(";")}`

const isImage = (v: unknown): v is ImageData =>
  typeof v === "object" && v !== null && "data" in v && (v as ImageData).data instanceof Uint8ClampedArray
/** An argument as it decides the paint: a canvas by what it shows, an
 * image by its bytes, a number to a thousandth. */
const arg = (v: unknown): string =>
  v instanceof HTMLCanvasElement
    ? `[${paintOf(v)}]`
    : isImage(v)
      ? `img(${v.width}x${v.height}:${hash(v.data)})`
      : typeof v === "number"
        ? String(Math.round(v * 1000) / 1000)
        : typeof v === "object" && v !== null && "describe" in v
          ? String((v as { describe: () => string }).describe())
          : String(v)

/** A gradient or pattern: what it was made from and its stops. */
function paintSource(kind: string, args: unknown[]) {
  const stops: string[] = []
  return {
    addColorStop: (at: number, colour: string) => void stops.push(`${arg(at)} ${colour}`),
    describe: () => `${kind}(${args.map(arg).join(",")}|${stops.join(",")})`,
  }
}

/** The calls that put ink down, and the state each reads as it does. */
const DRAWS = new Set(["fill", "stroke", "fillRect", "strokeRect", "fillText", "strokeText", "drawImage"])
const inks = (state: Record<string, unknown>) =>
  `{${Object.keys(state)
    .sort()
    .map((k) => `${k}=${arg(state[k])}`)
    .join(",")}}`

/** A fresh context's state, so a key set back to its default reads as never set. */
const DEFAULTS: Record<string, unknown> = {
  fillStyle: "#000000",
  strokeStyle: "#000000",
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  lineWidth: 1,
  lineCap: "butt",
  lineJoin: "miter",
  font: "10px sans-serif",
  textAlign: "start",
  textBaseline: "alphabetic",
  shadowBlur: 0,
  shadowColor: "rgba(0, 0, 0, 0)",
  imageSmoothingEnabled: true,
  filter: "none",
}

function context(canvas: Canvas): CanvasRenderingContext2D {
  const ops = () => opsOf(canvas)
  const wipe = () => void ops().splice(0)
  const whole = (x: number, y: number, w: number, h: number) =>
    x <= 0 && y <= 0 && x + w >= canvas.width && y + h >= canvas.height
  const state: Record<string, unknown> = { ...DEFAULTS }
  const own: Record<string, (...a: never[]) => unknown> = {
    createImageData: (w: number | ImageData, h?: number) => {
      const [width, height] = typeof w === "number" ? [w, h!] : [w.width, w.height]
      return { width, height, data: new Uint8ClampedArray(width * height * 4) }
    },
    getImageData: (_x: number, _y: number, width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    }),
    putImageData: (image: ImageData, x: number, y: number) => {
      if (whole(x, y, image.width, image.height)) wipe()
      ops().push(`put(${arg(image)},${x},${y})`)
    },
    clearRect: (x: number, y: number, w: number, h: number) => {
      if (whole(x, y, w, h)) wipe()
      else ops().push(`clearRect(${[x, y, w, h].map(arg).join(",")})`)
    },
    measureText: (text: string) => ({ width: String(text).length * 6 }),
    createLinearGradient: (...a: never[]) => paintSource("linear", a),
    createRadialGradient: (...a: never[]) => paintSource("radial", a),
    createConicGradient: (...a: never[]) => paintSource("conic", a),
    createPattern: (...a: never[]) => paintSource("pattern", a),
    isPointInPath: () => false,
    getLineDash: () => [],
    getTransform: () => new DOMMatrix(),
  }
  return new Proxy({} as CanvasRenderingContext2D, {
    get(_, key) {
      if (key === "canvas") return canvas
      if (typeof key !== "string") return undefined
      if (key in own) return own[key]
      if (key in state) return state[key]
      return (...a: unknown[]) => void ops().push(`${key}(${a.map(arg).join(",")})${DRAWS.has(key) ? inks(state) : ""}`)
    },
    set(_, key, value) {
      state[key as string] = value
      return true
    },
  })
}

/**
 * Give every 2D canvas a recording context and wipe a canvas when its size
 * is set, as a browser does. WebGL contexts stay unavailable (null), the
 * kit's CPU paths then paint. Returns the undo.
 */
export function recordPaint(): () => void {
  const proto = HTMLCanvasElement.prototype
  const getContext = proto.getContext
  const contexts = new WeakMap<Canvas, CanvasRenderingContext2D>()
  proto.getContext = function (this: Canvas, kind: string) {
    if (kind !== "2d") return null
    let ctx = contexts.get(this)
    if (!ctx) contexts.set(this, (ctx = context(this)))
    return ctx
  } as typeof proto.getContext
  const sizes = (["width", "height"] as const).map((key) => {
    const real = Object.getOwnPropertyDescriptor(proto, key)!
    Object.defineProperty(proto, key, {
      configurable: true,
      get: real.get,
      set(this: Canvas, value: number) {
        real.set!.call(this, value)
        opsOf(this).splice(0)
      },
    })
    return [key, real] as const
  })
  return () => {
    proto.getContext = getContext
    for (const [key, real] of sizes) Object.defineProperty(proto, key, real)
  }
}
