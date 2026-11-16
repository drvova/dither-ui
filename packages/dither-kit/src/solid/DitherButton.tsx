import { createMemo, For, type JSX, mergeProps, Show, splitProps } from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { labelFill, labelPaint } from "../engine/label-fill"
import { fillOf, pixelBloomStyle, type PixelBloomInput, type PixelColor, screenMatrix } from "../engine/pixel"
import { precompiledSrc, type DitherRenderMode, type PrecompiledDither } from "../engine/precompile"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { LabelFill } from "./runtime/fill-layers"

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
      class={cn(
        CONTROL_BUTTON,
        "relative isolate inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden rounded-md px-4 py-2 font-mono text-xs text-foreground transition-[opacity,scale] active:scale-[0.96] motion-reduce:transition-none",
        darkInk() && "text-black",
        props.class,
      )}
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
              class="absolute inset-0 -z-10 h-full w-full object-fill"
              style={{ "image-rendering": "pixelated" }}
            />
            <Show when={bloomStyle()}>
              {(style) => (
                <img
                  src={src()}
                  alt=""
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill"
                  style={{ ...glowStyle(style()), "image-rendering": "auto" }}
                />
              )}
            </Show>
          </>
        )}
      </Show>
      <Show when={props.loading}>
        <span aria-hidden="true" class="relative grid grid-cols-3 gap-0.5">
          <For each={[1, 2, 3]}>{() => <span class="size-1 bg-current opacity-70" />}</For>
        </span>
      </Show>
      <span class="relative">{props.children}</span>
    </button>
  )
}
