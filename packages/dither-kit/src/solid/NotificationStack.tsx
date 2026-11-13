import { createMemo, createSignal, For, type JSX, mergeProps, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { Presence } from "./runtime/presence"
import "./NotificationStack.css"

export type NotificationItem = {
  id: string
  title: string
  body?: string
  time?: string
  /** Text glyph for the leading icon box; omit for a dithered color dot. */
  icon?: string
  color?: PixelColor
}

const CARD = 64
const GAP = 8

/** Collapsed silhouettes — one expansion mechanism, three summaries. */
const VARIANTS = {
  stack: { peek: 10, origin: "50% 0%", at: (i: number) => `translateY(${i * 10}px) scale(${1 - i * 0.04})` },
  fan: {
    peek: 7,
    origin: "50% 130%",
    at: (i: number) => `translateY(${i * 7}px) rotate(${(i % 2 ? -1 : 1) * i * 2.2}deg) scale(${1 - i * 0.03})`,
  },
  condensed: { peek: 4, origin: "50% 0%", at: (i: number) => `translateY(${i * 4}px) scale(${1 - i * 0.07})` },
} as const
export type NotificationStackVariant = keyof typeof VARIANTS

export type NotificationStackProps = {
  items: NotificationItem[]
  /** Pinned-open state (with `onUpdateModelValue`); hover and focus expand transiently. */
  modelValue?: boolean
  onUpdateModelValue?: (expanded: boolean) => void
  onViewall?: () => void
  maxVisible?: number
  collapsedLabel?: string
  expandedLabel?: string
  emptyLabel?: string
  variant?: NotificationStackVariant
  color?: PixelColor
  class?: string
}

/** Compact notification cards that spring from a stacked summary into a
 * readable list on hover, focus or tap — tap pins the list open (the model),
 * hover and focus expand transiently. Three collapsed silhouettes share one
 * expansion: stack (peeked edges), fan (rotated hand), condensed (tight
 * slivers). Cards fan out on the house bouncy bezier with a per-card
 * stagger; reduced motion snaps. */
export default function NotificationStack(raw: NotificationStackProps) {
  const props = mergeProps(
    {
      modelValue: false,
      maxVisible: 3,
      collapsedLabel: "Notifications",
      expandedLabel: "View all",
      emptyLabel: "All caught up",
      variant: "stack" as NotificationStackVariant,
      color: "blue" as PixelColor,
    },
    raw,
  )

  const [hovering, setHovering] = createSignal(false)
  const [focused, setFocused] = createSignal(false)
  const visible = createMemo(() => props.items.slice(0, Math.max(1, props.maxVisible)))
  const expanded = createMemo(() => props.modelValue || hovering() || focused())
  const height = createMemo(() => {
    const n = visible().length
    if (!n) return CARD
    return expanded() ? n * (CARD + GAP) - GAP : CARD + (n - 1) * VARIANTS[props.variant].peek
  })
  const cardStyle = (i: number): JSX.CSSProperties => ({
    transform: expanded() ? `translateY(${i * (CARD + GAP)}px)` : VARIANTS[props.variant].at(i),
    "transform-origin": expanded() ? "50% 0%" : VARIANTS[props.variant].origin,
    opacity: expanded() ? 1 : String(Math.max(0.35, 1 - i * 0.25)),
    "z-index": String(visible().length - i),
    "transition-delay": `${(expanded() ? i : visible().length - 1 - i) * 40}ms`,
  })

  return (
    <div
      class={cn("w-72 font-mono select-none", props.class)}
      role="group"
      aria-label={props.collapsedLabel}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocusIn={() => setFocused(true)}
      onFocusOut={() => setFocused(false)}
    >
      <div class="flex h-7 items-center justify-between gap-2 px-1">
        <span class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {props.collapsedLabel}
          <Show when={props.items.length}>
            <span class="rounded-full border border-border/60 bg-background/60 px-1.5 text-[9px] tabular-nums">
              {props.items.length}
            </span>
          </Show>
        </span>
        <Presence name="dk-ns-fade" when={expanded() && props.items.length > 0}>
          <button
            type="button"
            class={cn(
              CONTROL_BUTTON,
              "rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground",
            )}
            onClick={() => props.onViewall?.()}
          >
            {props.expandedLabel} →
          </button>
        </Presence>
      </div>

      <Show
        when={visible().length}
        fallback={
          <div class="flex h-16 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-[12px] text-muted-foreground">
            {props.emptyLabel}
          </div>
        }
      >
        <div
          class="relative transition-[height] duration-300 motion-reduce:transition-none"
          style={{ height: `${height()}px`, "transition-timing-function": "cubic-bezier(0.2, 1.4, 0.4, 1)" }}
        >
          <For each={visible()}>
            {(item, i) => (
              <Dynamic
                component={i() === 0 ? "button" : "div"}
                {...(i() === 0
                  ? { type: "button", "aria-expanded": props.modelValue, "aria-label": props.collapsedLabel }
                  : {})}
                class={`absolute inset-x-0 top-0 flex h-16 items-center gap-2.5 overflow-hidden rounded-lg border border-border/60 bg-card px-3 text-left transition-[transform,opacity] duration-300 motion-reduce:transition-none ${
                  i() === 0 ? CONTROL_BUTTON : ""
                }`}
                style={{ ...cardStyle(i()), "transition-timing-function": "cubic-bezier(0.2, 1.4, 0.4, 1)" }}
                aria-hidden={i() > 0 && !expanded() ? "true" : undefined}
                onClick={() => i() === 0 && props.onUpdateModelValue?.(!props.modelValue)}
              >
                <span
                  aria-hidden="true"
                  class="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-background/60 text-[13px]"
                  style={{ color: cssColor(item.color ?? props.color) }}
                >
                  <Show
                    when={item.icon}
                    fallback={
                      <span class="size-2 rounded-[2px]" style={{ background: cssColor(item.color ?? props.color) }} />
                    }
                  >
                    {item.icon}
                  </Show>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate text-[12px] text-foreground">{item.title}</span>
                    <Show when={item.time}>
                      <span class="shrink-0 text-[9px] text-muted-foreground">{item.time}</span>
                    </Show>
                  </span>
                  <Show when={item.body}>
                    <span class="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.body}</span>
                  </Show>
                </span>
              </Dynamic>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
