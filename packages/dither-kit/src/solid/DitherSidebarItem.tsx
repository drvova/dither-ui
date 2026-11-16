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
  /** Right-aligned count — folds to a colored dot on the icon rail.
   * @docs string | number: dot on the rail
   * @default undefined */
  badge?: string | number
  onSelect?: () => void
  /** Leading icon; a small square without one. */
  icon?: JSX.Element
  class?: string
}
const OWN = ["label", "active", "color", "badge", "onSelect", "icon", "class"] as const satisfies readonly (keyof Own)[]

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
      class={[
        "relative flex items-center rounded-md text-left font-mono transition-colors",
        compact() ? "h-7 gap-2 px-2 text-[11px]" : "h-8 gap-2.5 px-2.5 text-[12px]",
        props.active ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
        props.class,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => props.onSelect?.()}
    >
      <Show when={props.active}>
        <canvas
          ref={(el) => (rail = el)}
          aria-hidden="true"
          class="absolute inset-y-1.5 left-0 w-[2px]"
          style={{ "image-rendering": "pixelated" }}
        />
      </Show>
      <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
        <Show when={icon()} fallback={<span class="size-1.5 rounded-[1px] bg-current opacity-70" />}>
          {icon()}
        </Show>
      </span>
      <Show when={!collapsed()}>
        <span class="min-w-0 flex-1 truncate">{props.label}</span>
      </Show>
      <Switch>
        <Match when={props.badge !== undefined && !collapsed()}>
          <span class="shrink-0 rounded border border-border/60 px-1 text-[10px] text-muted-foreground tabular-nums">
            {props.badge}
          </span>
        </Match>
        <Match when={props.badge !== undefined && collapsed()}>
          <span
            aria-hidden="true"
            class="absolute top-1.5 right-1.5 size-1.5 rounded-full"
            style={{ "background-color": cssColor(props.color) }}
          />
        </Match>
      </Switch>
    </button>
  )
}
