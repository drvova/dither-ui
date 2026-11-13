// Generated from ../solid/NotificationStack.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, type JSX, mergeProps, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { Presence } from "../solid/runtime/presence"
import "../solid/NotificationStack.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "flex",
    height: "1.75rem",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingInline: "0.25rem",
  },
  row2: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "11px",
    color: "var(--muted-foreground)",
  },
  text: {
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.375rem",
    fontSize: "9px",
    fontVariantNumeric: "   tabular-nums ",
  },
  row3: {
    display: "flex",
    height: "4rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  frame: {
    position: "relative",
    transitionProperty: { default: "height", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  grid: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    fontSize: "13px",
  },
  text2: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  text3: { minWidth: "0px", flex: "1" },
  row4: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" },
  text4: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "12px",
    color: "var(--foreground)",
  },
  text5: { flexShrink: "0", fontSize: "9px", color: "var(--muted-foreground)" },
  text6: {
    marginTop: "0.125rem",
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "11px",
    color: "var(--muted-foreground)",
  },
  box: { width: "18rem", fontFamily: "var(--font-mono)", WebkitUserSelect: "none", userSelect: "none" },
  button: {
    borderRadius: "var(--radius)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "10px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  absolute: {
    position: "absolute",
    insetInline: "0px",
    top: "0px",
    display: "flex",
    height: "4rem",
    alignItems: "center",
    gap: "0.625rem",
    overflow: "hidden",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    paddingInline: "0.75rem",
    textAlign: "left",
    transitionProperty: { default: "transform, opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
})

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
  xstyle?: StyleProp
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
      class={cn(styles.box, props.xstyle, props.class)}
      role="group"
      aria-label={props.collapsedLabel}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocusIn={() => setFocused(true)}
      onFocusOut={() => setFocused(false)}
    >
      <div {...stylex.props(styles.row)}>
        <span {...stylex.props(styles.row2)}>
          {props.collapsedLabel}
          <Show when={props.items.length}>
            <span {...stylex.props(styles.text)}>{props.items.length}</span>
          </Show>
        </span>
        <Presence name="dk-ns-fade" when={expanded() && props.items.length > 0}>
          <button type="button" class={cn(CONTROL_BUTTON, styles.button)} onClick={() => props.onViewall?.()}>
            {props.expandedLabel} →
          </button>
        </Presence>
      </div>

      <Show when={visible().length} fallback={<div {...stylex.props(styles.row3)}>{props.emptyLabel}</div>}>
        <div
          {...stylex.props(styles.frame)}
          style={{ height: `${height()}px`, "transition-timing-function": "cubic-bezier(0.2, 1.4, 0.4, 1)" }}
        >
          <For each={visible()}>
            {(item, i) => (
              <Dynamic
                component={i() === 0 ? "button" : "div"}
                {...(i() === 0
                  ? { type: "button", "aria-expanded": props.modelValue, "aria-label": props.collapsedLabel }
                  : {})}
                class={cn([styles.absolute, i() === 0 ? CONTROL_BUTTON : null])}
                style={{ ...cardStyle(i()), "transition-timing-function": "cubic-bezier(0.2, 1.4, 0.4, 1)" }}
                aria-hidden={i() > 0 && !expanded() ? "true" : undefined}
                onClick={() => i() === 0 && props.onUpdateModelValue?.(!props.modelValue)}
              >
                <span
                  aria-hidden="true"
                  {...stylex.props(styles.grid)}
                  style={{ color: cssColor(item.color ?? props.color) }}
                >
                  <Show
                    when={item.icon}
                    fallback={
                      <span
                        {...stylex.props(styles.text2)}
                        style={{ background: cssColor(item.color ?? props.color) }}
                      />
                    }
                  >
                    {item.icon}
                  </Show>
                </span>
                <span {...stylex.props(styles.text3)}>
                  <span {...stylex.props(styles.row4)}>
                    <span {...stylex.props(styles.text4)}>{item.title}</span>
                    <Show when={item.time}>
                      <span {...stylex.props(styles.text5)}>{item.time}</span>
                    </Show>
                  </span>
                  <Show when={item.body}>
                    <span {...stylex.props(styles.text6)}>{item.body}</span>
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
