// Generated from dither-kit/solid/PreviewRail.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, type JSX, mergeProps, Show } from "solid-js"
import { cssColor } from "dither-kit/engine/palette.ts"
import { type PixelColor, pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
import { POPOVER } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    height: "0.125rem",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "color-mix(in oklab, var(--foreground) 30%, transparent)",
    transitionProperty: { default: "width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  box: { fontSize: "12px", fontWeight: "500", color: "var(--foreground)" },
  p: { marginTop: "0.125rem", fontSize: "11px", color: "var(--muted-foreground)" },
  nav: {
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    gap: "0.5rem",
    paddingBlock: "0.25rem",
  },
  button: {
    display: "flex",
    height: "1rem",
    width: "2.25rem",
    alignItems: "center",
    borderRadius: "var(--radius)",
    paddingInline: "0.25rem",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
  justifyEnd: { justifyContent: "flex-end" },
  justifyStart: { justifyContent: "flex-start" },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    zIndex: "10",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    whiteSpace: "nowrap",
    transitionProperty: { default: "top", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  rightFull: { right: "100%", marginRight: "0.5rem" },
  leftFull: { left: "100%", marginLeft: "0.5rem" },
})

export type PreviewRailItem = { value: string; label: string; hint?: string; color?: PixelColor }

export type PreviewRailProps = {
  items: PreviewRailItem[]
  modelValue?: string
  /** Pyramid falloff radius in px. */
  range?: number
  /** Screen edge the rail hugs; the preview floats toward the other side. */
  side?: "left" | "right"
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  /** What the floating preview shows for an item, in place of its label and hint. */
  preview?: (scope: { item: PreviewRailItem }) => JSX.Element
}

/** Codex-style navigation rail — compact ticks swell into a pyramid around
 * the pointer and float a destination preview beside the hovered or focused
 * tick. Reduced motion keeps the ticks still; the preview remains. */
export default function PreviewRail(raw: PreviewRailProps) {
  const props = mergeProps({ range: 56, side: "left" as const }, raw)

  let rail: HTMLElement | undefined
  const [py, setPy] = createSignal<number | null>(null)
  const [focusIndex, setFocusIndex] = createSignal<number | null>(null)
  // Asked once, by the first pointer over the rail: a server render has no
  // media to ask.
  let still: boolean | undefined

  function track(e: PointerEvent) {
    const r = rail?.getBoundingClientRect()
    if (r) setPy(e.clientY - r.top)
  }
  function onFocusin(e: FocusEvent) {
    const b = (e.target as HTMLElement).closest("button")
    setFocusIndex(b ? Number(b.dataset.i) : null)
  }

  const centerOf = (i: number) => {
    const b = rail?.querySelectorAll("button")[i] as HTMLElement | undefined
    return b ? b.offsetTop + b.offsetHeight / 2 : null
  }
  const widthOf = (i: number) => {
    const rest = props.items[i]?.value === props.modelValue ? 16 : 10
    const at = py()
    if (at === null || (still ??= pixelPrefersReducedMotion())) return rest
    const c = centerOf(i)
    const w = c === null ? 0 : Math.max(0, 1 - Math.abs(at - c) / props.range)
    return rest + 16 * w
  }
  const previewIndex = createMemo(() => {
    const focused = focusIndex()
    if (focused !== null) return focused
    const at = py()
    if (at === null) return null
    let best: number | null = null
    let bd = Infinity
    for (let i = 0; i < props.items.length; i++) {
      const c = centerOf(i)
      if (c === null) continue
      const d = Math.abs(at - c)
      if (d < bd) {
        bd = d
        best = i
      }
    }
    return best
  })
  const preview = createMemo(() => {
    const i = previewIndex()
    return i === null ? null : (props.items[i] ?? null)
  })
  const previewTop = createMemo(() => {
    const i = previewIndex()
    return i === null ? 0 : (centerOf(i) ?? 0)
  })

  return (
    <nav
      ref={(el) => (rail = el)}
      class={cn(styles.nav, props.xstyle, props.class)}
      aria-label="Preview rail"
      onPointerMove={track}
      onPointerLeave={() => setPy(null)}
      onFocusIn={onFocusin}
      onFocusOut={() => setFocusIndex(null)}
    >
      <For each={props.items}>
        {(it, i) => (
          <button
            type="button"
            data-i={i()}
            aria-label={it.hint ? `${it.label} — ${it.hint}` : it.label}
            aria-current={it.value === props.modelValue ? "page" : undefined}
            class={cn(styles.button, props.side === "right" ? styles.justifyEnd : styles.justifyStart)}
            onClick={() => props.onUpdateModelValue?.(it.value)}
          >
            <span
              aria-hidden="true"
              {...stylex.props(styles.text)}
              style={{
                width: `${widthOf(i())}px`,
                ...(it.value === props.modelValue ? { background: cssColor(it.color ?? "blue") } : {}),
              }}
            />
          </button>
        )}
      </For>
      <Show when={preview()}>
        {(shown) => (
          <div
            aria-hidden="true"
            class={cn(POPOVER, styles.layer, props.side === "right" ? styles.rightFull : styles.leftFull)}
            style={{ top: `${previewTop()}px`, transform: "translateY(-50%)" }}
          >
            <Show
              when={props.preview}
              fallback={
                <>
                  <div {...stylex.props(styles.box)}>{shown().label}</div>
                  <Show when={shown().hint}>
                    <p {...stylex.props(styles.p)}>{shown().hint}</p>
                  </Show>
                </>
              }
            >
              {props.preview?.({ item: shown() })}
            </Show>
          </div>
        )}
      </Show>
    </nav>
  )
}
