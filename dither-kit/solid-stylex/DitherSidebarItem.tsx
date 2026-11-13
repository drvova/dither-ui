// Generated from ../solid/DitherSidebarItem.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import {
  children,
  createEffect,
  type JSX,
  Match,
  mergeProps,
  on,
  onMount,
  Show,
  splitProps,
  Switch,
  useContext,
} from "solid-js"
import { cssColor } from "../engine/palette"
import { BAYER4, fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { SIDEBAR_COLLAPSED, SIDEBAR_COMPACT } from "./DitherSidebar"
import { cn, type StyleProp } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", insetBlock: "0.375rem", left: "0px", width: "2px" },
  grid: { display: "grid", width: "1rem", height: "1rem", flexShrink: "0", placeItems: "center" },
  text: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "1px",
    backgroundColor: "currentcolor",
    opacity: "70%",
  },
  text2: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text3: {
    flexShrink: "0",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "10px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  layer: {
    position: "absolute",
    top: "0.375rem",
    right: "0.375rem",
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
  },
  button: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderRadius: "var(--radius)",
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  h7: { height: "1.75rem", gap: "0.5rem", paddingInline: "0.5rem", fontSize: "11px" },
  h8: { height: "2rem", gap: "0.625rem", paddingInline: "0.625rem", fontSize: "12px" },
  bgCard: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
})

/** 2px dithered rail marking the active item — same recipe as the tabs underline. */
function paintRail(canvas: HTMLCanvasElement, color: PixelColor, cssHeight: number, matrix: number[][] = BAYER4) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const rows = Math.max(4, Math.round(cssHeight / 2))
  canvas.width = 1
  canvas.height = rows
  const fill = fillOf(color)
  const px = cellCanvas(ctx, 1, rows)
  for (let y = 0; y < rows; y++) {
    const k = 0.55 + 0.45 * (1 - Math.abs(y / rows - 0.5) * 2)
    if (k > matrix[y & 3][0] * 0.9) px.cell(0, y, fill, k)
  }
  px.flush()
}

type Own = {
  label: string
  active?: boolean
  color?: PixelColor
  /** Right-aligned count — folds to a colored dot on the icon rail. */
  badge?: string | number
  onSelect?: () => void
  /** Leading icon; a small square without one. */
  icon?: JSX.Element
  class?: string
  xstyle?: StyleProp
}
const OWN = [
  "label",
  "active",
  "color",
  "badge",
  "onSelect",
  "icon",
  "class",
  "xstyle",
] as const satisfies readonly (keyof Own)[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type DitherSidebarItemProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own | "children">

export default function DitherSidebarItem(raw: DitherSidebarItemProps) {
  const merged = mergeProps({ active: false, color: "blue" as PixelColor }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const icon = children(() => props.icon)
  const collapsed = useContext(SIDEBAR_COLLAPSED)
  const compact = useContext(SIDEBAR_COMPACT)
  let rail: HTMLCanvasElement | undefined

  function paint() {
    const c = rail
    if (c && c.isConnected && props.active) paintRail(c, props.color, 24)
  }
  onMount(() => {
    paint()
    createEffect(
      on(
        () => [props.active, props.color],
        () => requestAnimationFrame(paint),
        { defer: true },
      ),
    )
  })

  return (
    <button
      {...rest}
      type="button"
      aria-current={props.active ? "true" : undefined}
      title={collapsed() ? props.label : undefined}
      class={cn([
        styles.button,
        compact() ? styles.h7 : styles.h8,
        props.active ? styles.bgCard : styles.textMutedForeground,
        props.xstyle,
        props.class,
      ])}
      onClick={() => props.onSelect?.()}
    >
      <Show when={props.active}>
        <canvas
          ref={(el) => (rail = el)}
          aria-hidden="true"
          {...stylex.props(styles.canvas)}
          style={{ "image-rendering": "pixelated" }}
        />
      </Show>
      <span {...stylex.props(styles.grid)} aria-hidden="true">
        <Show when={icon()} fallback={<span {...stylex.props(styles.text)} />}>
          {icon()}
        </Show>
      </span>
      <Show when={!collapsed()}>
        <span {...stylex.props(styles.text2)}>{props.label}</span>
      </Show>
      <Switch>
        <Match when={props.badge !== undefined && !collapsed()}>
          <span {...stylex.props(styles.text3)}>{props.badge}</span>
        </Match>
        <Match when={props.badge !== undefined && collapsed()}>
          <span
            aria-hidden="true"
            {...stylex.props(styles.layer)}
            style={{ "background-color": cssColor(props.color) }}
          />
        </Match>
      </Switch>
    </button>
  )
}
