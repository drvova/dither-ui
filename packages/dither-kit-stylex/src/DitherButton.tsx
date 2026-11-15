// Generated from @dither-ui/kit/solid/DitherButton.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, For, type JSX, mergeProps, Show, splitProps } from "solid-js"
import { kitFromSeed } from "@dither-ui/kit/engine/dither-paint.ts"
import { labelFill, labelPaint } from "@dither-ui/kit/engine/label-fill.ts"
import {
  fillOf,
  pixelBloomStyle,
  type PixelBloomInput,
  type PixelColor,
  screenMatrix,
} from "@dither-ui/kit/engine/pixel.ts"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "@dither-ui/kit/engine/precompile.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { LabelFill } from "./runtime/fill-layers"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  img: {
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
    objectFit: "fill",
  },
  img2: {
    pointerEvents: "none",
    position: "absolute",
    inset: "0px",
    zIndex: "-10",
    height: "100%",
    width: "100%",
    objectFit: "fill",
  },
  grid: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.125rem",
  },
  text: { width: "0.25rem", height: "0.25rem", backgroundColor: "currentcolor", opacity: "70%" },
  frame: { position: "relative" },
  button: {
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    minHeight: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--foreground)",
    transitionProperty: { default: "opacity, scale", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    scale: { default: null, ":active": "0.96" },
  },
  textBlack: { color: "#000" },
})

export type ButtonVariant = "gradient" | "dotted" | "hatched" | "solid"
export type { DitherRenderMode, PrecompiledDither }

/** The key's height at rest in px (`min-h-10`): its gradient's rows until
 * its box reports a taller one. */
const HEIGHT = 40

/** The fill's intensity at rest, hovered and pressed. */
const STATES = [0, 1, 1.5]

type Own = {
  /** @default seed / blue */
  color?: PixelColor
  /** @default seed / gradient */
  variant?: ButtonVariant
  /** @docs "off" | "low" | "high" | "aura" | object | number
   * @default seed / off */
  bloom?: PixelBloomInput
  /** CSS px per dither cell: chunkiness.
   * @docs number (px)
   * @default seed / 2 */
  cell?: number
  /** @default undefined */
  seed?: number
  type?: "button" | "submit" | "reset"
  loading?: boolean
  disabled?: boolean
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
  /** `"static"` holds the fill at rest: no hover or press. */
  renderMode?: DitherRenderMode
  /** @docs string | { src: string; width?: number; height?: number }
   * @default undefined */
  precompiled?: PrecompiledDither
}
const OWN = [
  "color",
  "variant",
  "bloom",
  "cell",
  "seed",
  "type",
  "loading",
  "disabled",
  "class",
  "xstyle",
  "renderMode",
  "precompiled",
  "children",
] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherButtonProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherButton(raw: DitherButtonProps) {
  const merged = mergeProps(
    { type: "button" as const, loading: false, disabled: false, renderMode: "live" as DitherRenderMode },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)
  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const precompiled = createMemo(() => precompiledSrc(props.precompiled))
  const color = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const variant = createMemo<ButtonVariant>(() => props.variant ?? s()?.variant ?? "gradient")
  const matrix = createMemo(() => screenMatrix("bayer", props.seed))
  // A bright fill takes black ink: the theme's would sink under AA. The fill
  // prints at the same call's tone.
  const darkInk = createMemo(() => labelFill(fillOf(color()), variant(), "premultiplied", matrix()).darkInk)
  const bloom = createMemo<PixelBloomInput>(() => props.bloom ?? (props.seed !== undefined ? props.seed : "off"))
  const cell = createMemo(() => props.cell ?? s()?.cell ?? 2)
  // The fill as tone classes, at rest and (live) hovered and pressed: the
  // stylesheet steps between them, so nothing paints on the page.
  const paint = (rows: number) =>
    (props.renderMode === "static" ? STATES.slice(0, 1) : STATES).map((intensity) =>
      labelPaint(fillOf(color()), variant(), "premultiplied", matrix(), rows, intensity),
    )
  const bloomStyle = createMemo(() => pixelBloomStyle(bloom()))
  const glowStyle = (style: NonNullable<ReturnType<typeof pixelBloomStyle>>): JSX.CSSProperties => ({
    filter: style.filter,
    opacity: style.opacity,
    "mix-blend-mode": style.mixBlendMode,
  })

  return (
    <button
      {...rest}
      type={props.type}
      disabled={props.loading || props.disabled}
      aria-busy={props.loading || undefined}
      class={cn(CONTROL_BUTTON, styles.button, darkInk() && styles.textBlack, props.xstyle, props.class)}
    >
      <Show
        when={precompiled()}
        fallback={
          <>
            <LabelFill paint={paint} height={HEIGHT} cell={cell()} />
            <Show when={bloomStyle()}>
              {(style) => <LabelFill paint={paint} height={HEIGHT} cell={cell()} style={glowStyle(style())} />}
            </Show>
          </>
        }
      >
        {(src) => (
          <>
            <img
              src={src()}
              alt=""
              aria-hidden="true"
              {...stylex.props(styles.img)}
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <img
                  src={src()}
                  alt=""
                  aria-hidden="true"
                  {...stylex.props(styles.img2)}
                  style={{ ...glowStyle(style()), "image-rendering": "auto" }}
                />
              )}
            </Show>
          </>
        )}
      </Show>
      <Show when={props.loading}>
        <span aria-hidden="true" {...stylex.props(styles.grid)}>
          <For each={[1, 2, 3]}>{() => <span {...stylex.props(styles.text)} />}</For>
        </span>
      </Show>
      <span {...stylex.props(styles.frame)}>{props.children}</span>
    </button>
  )
}
