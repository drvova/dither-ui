import {
  type Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js"
import { kitFromSeed } from "../engine/dither-paint"
import { fillOf, type PixelColor } from "../engine/pixel"
import { cellCanvas } from "../engine/raster"
import { cn } from "../tailwind/lib"
import { useDitherMatrix } from "./runtime/screen"

export type TabsVariant = "underline" | "segmented" | "washed"
export type TabItem = {
  value: string
  label?: string
  badge?: string | number
  disabled?: boolean
}

export type TabsContext = { active: Accessor<string>; idBase: string }
export const TABS_CTX = createContext<TabsContext>()

const CELL = 2

/** Underline: a dither ramp along the run (same recipe as the gradient fade). */
function paintUnderline(
  canvas: HTMLCanvasElement,
  length: number,
  color: PixelColor,
  vertical: boolean,
  matrix: number[][],
) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || length <= 0) return
  const cells = Math.max(4, Math.round(length / CELL))
  canvas.width = vertical ? 1 : cells
  canvas.height = vertical ? cells : 1
  const fill = fillOf(color)
  const px = cellCanvas(ctx, canvas.width, canvas.height)
  for (let i = 0; i < cells; i++) {
    const density = (i + 0.5) / cells
    const lit = density > matrix[0][i & 3]
    const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
    if (alpha <= 0.004) continue
    if (vertical) px.cell(0, i, fill, alpha)
    else px.cell(i, 0, fill, alpha)
  }
  px.flush()
}

/** Washed: a quiet rest-intensity fill behind the active tab. */
function paintWash(canvas: HTMLCanvasElement, w: number, h: number, color: PixelColor, matrix: number[][]) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx || w <= 0 || h <= 0) return
  const cols = Math.max(4, Math.round(w / CELL))
  const rows = Math.max(4, Math.round(h / CELL))
  canvas.width = cols
  canvas.height = rows
  const fill = fillOf(color)
  const px = cellCanvas(ctx, cols, rows)
  for (let y = 0; y < rows; y++) {
    const density = 0.2 + 0.5 * ((y + 0.5) / rows)
    for (let x = 0; x < cols; x++) {
      const lit = density > matrix[y & 3][x & 3]
      px.cell(x, y, fill, lit ? 0.32 : 0.08)
    }
  }
  // The rule along the foot, over the wash.
  px.rect(0, rows - 1, cols, 1, fill, 0.5)
  px.flush()
}

export type DitherTabsProps = {
  /** Plain strings or { value, label, badge, disabled } items. */
  tabs: (string | TabItem)[]
  modelValue: string
  color?: PixelColor
  /** underline: moving dither strip · segmented: boxed chips · washed: dither fill. */
  variant?: TabsVariant
  orientation?: "horizontal" | "vertical"
  seed?: number
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** Panels: put DitherTabPanel children here so they inherit the context. */
  children?: JSX.Element
}

export default function DitherTabs(raw: DitherTabsProps) {
  const props = mergeProps({ variant: "underline" as TabsVariant, orientation: "horizontal" as const }, raw)

  const s = createMemo(() => (props.seed !== undefined ? kitFromSeed(props.seed) : null))
  const effColor = createMemo<PixelColor>(() => props.color ?? s()?.hue ?? "blue")
  const matrix = useDitherMatrix(() => props.seed)

  // An id the server and the browser agree on, where a counter would not.
  const idBase = `dk-tabs-${createUniqueId()}`

  const items = createMemo<TabItem[]>(() => props.tabs.map((t) => (typeof t === "string" ? { value: t } : t)))
  const vertical = createMemo(() => props.orientation === "vertical")

  let list: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const tabRefs: HTMLButtonElement[] = []
  const [marker, setMarker] = createSignal({ left: 0, top: 0, width: 0, height: 0 })

  function measure() {
    if (props.variant === "segmented") return
    const i = items().findIndex((t) => t.value === props.modelValue)
    const btn = tabRefs[i]
    if (!btn || !canvas) return
    setMarker({ left: btn.offsetLeft, top: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight })
    if (props.variant === "washed") paintWash(canvas, btn.offsetWidth, btn.offsetHeight, effColor(), matrix())
    else paintUnderline(canvas, vertical() ? btn.offsetHeight : btn.offsetWidth, effColor(), vertical(), matrix())
  }

  function select(value: string) {
    props.onUpdateModelValue?.(value)
  }

  function onKeydown(e: KeyboardEvent) {
    const fwd = vertical() ? "ArrowDown" : "ArrowRight"
    const back = vertical() ? "ArrowUp" : "ArrowLeft"
    let next: number
    const enabled = items()
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => !t.disabled)
    const pos = enabled.findIndex(({ t }) => t.value === props.modelValue)
    if (e.key === fwd) next = (pos + 1) % enabled.length
    else if (e.key === back) next = (pos - 1 + enabled.length) % enabled.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = enabled.length - 1
    else return
    e.preventDefault()
    const target = enabled[next]
    select(target.t.value)
    queueMicrotask(() => tabRefs[target.i]?.focus())
  }

  const markerStyle = createMemo(() => {
    if (props.variant === "washed")
      return {
        left: `${marker().left}px`,
        top: `${marker().top}px`,
        width: `${marker().width}px`,
        height: `${marker().height}px`,
      }
    return vertical()
      ? { left: "0px", top: `${marker().top}px`, width: "2px", height: `${marker().height}px` }
      : // On the tab's own floor, not the container's: panels nest inside it.
        {
          left: `${marker().left}px`,
          top: `${marker().top + marker().height - 2}px`,
          width: `${marker().width}px`,
          height: "2px",
        }
  })

  let ro: ResizeObserver | null = null
  onMount(() => {
    requestAnimationFrame(() => {
      measure()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(measure)
        if (list) ro.observe(list)
      }
    })
    createEffect(
      on(
        () => [props.modelValue, props.tabs, effColor(), props.variant, props.orientation, matrix()],
        () => queueMicrotask(measure),
        { defer: true },
      ),
    )
  })
  onCleanup(() => ro?.disconnect())

  return (
    <TABS_CTX.Provider value={{ active: () => props.modelValue, idBase }}>
      <div class={cn("relative", vertical() ? "flex gap-4" : "", props.class)}>
        <div
          ref={(el) => (list = el)}
          role="tablist"
          aria-orientation={props.orientation}
          class={cn(
            vertical() ? "relative flex flex-col" : "relative flex",
            props.variant === "segmented"
              ? ["gap-1 rounded-md border border-border/60 p-1", !vertical() && "items-center"]
              : props.variant === "underline"
                ? vertical()
                  ? "gap-1 pl-3"
                  : "gap-4"
                : "gap-1",
          )}
          onKeyDown={onKeydown}
        >
          <For each={items()}>
            {(t, i) => (
              <button
                id={`${idBase}-tab-${t.value}`}
                ref={(el) => (tabRefs[i()] = el)}
                type="button"
                role="tab"
                aria-selected={t.value === props.modelValue}
                aria-controls={`${idBase}-panel-${t.value}`}
                tabIndex={t.value === props.modelValue ? 0 : -1}
                disabled={t.disabled}
                class={cn(
                  "relative z-10 flex items-center gap-1.5 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
                  props.variant === "underline"
                    ? vertical()
                      ? "rounded-md px-2 py-1.5 text-left"
                      : "pb-2"
                    : "rounded px-2.5 py-1 text-left",
                  t.value === props.modelValue
                    ? props.variant === "segmented"
                      ? "bg-card text-foreground"
                      : "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => select(t.value)}
              >
                {/* The space the label keeps before its badge: a reader hears "Code 3". */}
                {t.label ?? t.value}{" "}
                <Show when={t.badge !== undefined}>
                  <span class="rounded border border-border/60 px-1 text-[10px] text-muted-foreground tabular-nums">
                    {t.badge}
                  </span>
                </Show>
              </button>
            )}
          </For>
          {/* The marker lives in the list, so a list that scrolls (more tabs
              than width) carries it with its tab and clips it at its edges. */}
          <Show when={props.variant !== "segmented"}>
            <canvas
              ref={(el) => (canvas = el)}
              aria-hidden="true"
              class={cn(
                "absolute transition-[left,top,width,height] duration-200 motion-reduce:transition-none",
                props.variant === "washed" && "rounded",
              )}
              style={{ ...markerStyle(), "image-rendering": "pixelated" }}
            />
          </Show>
        </div>
        {/* Panels: put DitherTabPanel children here so they inherit the context. */}
        {props.children}
      </div>
    </TABS_CTX.Provider>
  )
}
