// One layer of a stage: its keyframes sampled at the stage's moment, written
// as a CSS transform that keeps the keyframes' units (the browser measures the
// container), and handed to the slot as px against the measured box for
// painters. Any content — a kit canvas surface, an SVG, text — rides it.
import { createMemo, type JSX, mergeProps, useContext } from "solid-js"
import { Dynamic } from "solid-js/web"
import {
  compileTrack,
  type KeyEasing,
  type Keyframe,
  keyframeTransform,
  resolveSample,
  sampleKeyframes,
} from "../engine/keyframes"
import { cn } from "../tailwind/lib"
import { STAGE } from "./DitherStage"
import "./DitherLayer.css"

/** What the slot receives: every property resolved to px / degrees, then the moment's shape. */
export type LayerSlot = {
  [resolved: string]: number
  progress: number
  cycle: number
  time: number
  width: number
  height: number
}

export type DitherLayerProps = {
  /** The track: { at?, easing?, x, y, rotate, scale, scaleX, scaleY, skewX, skewY, opacity, ...custom } per key. */
  keyframes?: Keyframe[]
  /** Seconds of one cycle; unset, the last key's `at` in seconds, else 1. */
  duration?: number
  delay?: number
  /** Cycles: a count, or true forever. */
  loop?: number | boolean
  yoyo?: boolean
  easing?: KeyEasing
  /** transform-origin — container units welcome. */
  origin?: string
  as?: string
  class?: string
  /** A function child receives the slot: each member read where it is used,
   * so it follows the stage. */
  children?: JSX.Element | ((scope: LayerSlot) => JSX.Element)
}

const NONE = { width: 0, height: 0 }
const NO_KEYS: Keyframe[] = []

export default function DitherLayer(raw: DitherLayerProps) {
  const props = mergeProps({ keyframes: NO_KEYS, delay: 0, loop: 1, yoyo: false, origin: "50% 50%", as: "div" }, raw)

  const stage = useContext(STAGE)
  const time = createMemo(() => (stage?.reduced() ? Infinity : (stage?.time() ?? 0)))
  const box = createMemo(() => stage?.box() ?? NONE)
  const track = createMemo(() =>
    compileTrack({
      keyframes: props.keyframes,
      duration: props.duration,
      delay: props.delay,
      loop: props.loop,
      yoyo: props.yoyo,
      easing: props.easing,
    }),
  )
  const sample = createMemo(() => sampleKeyframes(track(), time()))
  const resolved = createMemo(() => resolveSample(sample(), box()))
  const fmt = (n: number) => String(Math.round(n * 1000) / 1000)
  const style = createMemo(() => {
    const s: Record<string, string> = {
      transform: keyframeTransform(sample()),
      "transform-origin": props.origin,
      "--layer-p": fmt(sample().progress),
    }
    if (sample().numbers.opacity !== undefined) s.opacity = fmt(sample().numbers.opacity)
    for (const [name, value] of Object.entries(resolved()))
      s[`--layer-${name}`] = name in sample().lengths ? `${fmt(value)}px` : fmt(value)
    return s
  })
  const slotProps = createMemo<LayerSlot>(() => ({
    ...resolved(),
    progress: sample().progress,
    cycle: sample().cycle,
    time: Number.isFinite(time()) ? time() : 0,
    width: box().width,
    height: box().height,
  }))
  // The slot as one standing object over the moment's values.
  const scope = new Proxy({} as LayerSlot, {
    get: (_, key) => (typeof key === "string" ? slotProps()[key] : undefined),
    has: (_, key) => typeof key === "string" && key in slotProps(),
    ownKeys: () => Reflect.ownKeys(slotProps()),
    getOwnPropertyDescriptor: (_, key) =>
      typeof key === "string" && key in slotProps()
        ? { value: slotProps()[key], enumerable: true, configurable: true }
        : undefined,
  })

  return (
    <Dynamic
      component={props.as}
      class={cn("dither-layer", props.class)}
      style={style() as JSX.CSSProperties}
      data-layer={sample().state}
    >
      {(() => {
        const c = props.children
        return typeof c === "function" ? c(scope) : c
      })()}
    </Dynamic>
  )
}
