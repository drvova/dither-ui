// Generated from ../solid/DitherDrawer.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  Show,
  useContext,
} from "solid-js"
import { Portal } from "solid-js/web"
import { project, rubberband, velocityFrom, type VelocitySample } from "../engine/gesture"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "./lib"
import FocusScope from "./FocusScope"
import { Presence } from "../solid/runtime/presence"
import "../solid/DitherDrawer.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    backgroundColor: "color-mix(in oklab, #000 60%, transparent)",
  },
  box: {
    marginInline: "auto",
    marginBottom: "0.75rem",
    height: "0.25rem",
    width: "2.5rem",
    flexShrink: "0",
    touchAction: "none",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "var(--border)",
  },
  focusScope: { display: "flex", minHeight: "0px", flex: "1", flexDirection: "column", outlineStyle: "none" },
  row: {
    display: "flex",
    touchAction: "none",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingBottom: "0.75rem",
  },
  text: { fontSize: "0.875rem", lineHeight: "calc(1.25 / 0.875)", fontWeight: "500" },
  button: {
    display: "flex",
    width: "1.75rem",
    height: "1.75rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  box2: { minHeight: "0px", flex: "1", overflowY: "auto" },
  stack: {
    position: "fixed",
    zIndex: "50",
    display: "flex",
    flexDirection: "column",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "1rem",
    fontFamily: "var(--font-mono)",
  },
  insetX0: {
    insetInline: "0px",
    bottom: "0px",
    borderTopLeftRadius: "0.75rem",
    borderTopRightRadius: "0.75rem",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
  },
  insetY0: { insetBlock: "0px", width: "20rem", maxWidth: "85vw" },
  maxH85dvh: { maxHeight: "85dvh" },
  right0: { right: "0px", borderLeftStyle: "solid", borderLeftWidth: "1px" },
  left0: { left: "0px", borderRightStyle: "solid", borderRightWidth: "1px" },
  selectNone: { WebkitUserSelect: "none", userSelect: "none" },
  transitionTransformFilter: {
    transitionProperty: { default: "transform, filter", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  touchPanY: { touchAction: " pan-y " },
})

export type DrawerSide = "right" | "left" | "bottom"

/** Nested-drawer channel: a child drawer tells its parent (or an app-level
 * DitherDrawerIndent) to push back while it is open. */
export type DrawerChannel = { notify: (delta: number) => void }
export const DRAWER_CHANNEL = createContext<DrawerChannel>()

/** Snap points: 0..1 = fraction of viewport height, >1 = px. */
const resolveSnap = (s: number) => (s <= 1 ? s * window.innerHeight : s)

export type DitherDrawerProps = {
  open: boolean
  side?: DrawerSide
  title?: string
  /** Swipe-to-dismiss gesture on the panel. */
  swipe?: boolean
  /** Bottom sheets only: preset visible heights (0..1 viewport fraction, >1 px). */
  snapPoints?: number[]
  /** Active snap point (with `onUpdateSnapPoint`). Defaults to the first. */
  snapPoint?: number
  /** false renders no backdrop and leaves the page interactive. */
  modal?: boolean
  /** false keeps the drawer open on backdrop clicks (Escape still closes). */
  dismissible?: boolean
  onClose?: () => void
  onUpdateSnapPoint?: (snap: number) => void
  children?: JSX.Element
}

export default function DitherDrawer(raw: DitherDrawerProps) {
  const props = mergeProps({ side: "right" as DrawerSide, swipe: true, modal: true, dismissible: true }, raw)

  let panelRef: HTMLDivElement | undefined

  // --- nesting: push this drawer back while a child drawer is open ------------
  const parent = useContext(DRAWER_CHANNEL) ?? null
  const [childOpen, setChildOpen] = createSignal(0)
  const channel: DrawerChannel = { notify: (d) => setChildOpen((n) => n + d) }
  createEffect(
    on(
      () => props.open,
      (v, old) => {
        if (parent && v !== !!old) parent.notify(v ? 1 : -1)
      },
    ),
  )
  onCleanup(() => {
    if (parent && props.open) parent.notify(-1)
  })

  // --- snap points (bottom sheets) ---------------------------------------------
  const hasSnaps = createMemo(() => props.side === "bottom" && !!props.snapPoints && props.snapPoints.length > 0)
  const [internalSnap, setInternalSnap] = createSignal<number | null>(null)
  const activeSnap = createMemo(() => props.snapPoint ?? internalSnap() ?? props.snapPoints?.[0] ?? 1)
  createEffect(
    on(
      () => props.open,
      (v) => {
        if (v) setInternalSnap(props.snapPoint ?? props.snapPoints?.[0] ?? null)
      },
      { defer: true },
    ),
  )
  const maxSnapPx = createMemo(() => (hasSnaps() ? Math.max(...props.snapPoints!.map(resolveSnap)) : 0))
  const activeSnapPx = createMemo(() => (hasSnaps() ? resolveSnap(activeSnap()) : 0))
  /** Resting translateY for the current snap: hide everything below it. */
  const snapBase = createMemo(() => (hasSnaps() ? maxSnapPx() - activeSnapPx() : 0))

  function setSnap(s: number) {
    setInternalSnap(s)
    props.onUpdateSnapPoint?.(s)
  }

  // --- swipe: 1:1 tracking, rubber-band, momentum projection -------------------
  const axis = createMemo(() => (props.side === "bottom" ? "y" : "x"))
  const dismissSign = createMemo(() => (props.side === "left" ? -1 : 1))
  const [dragging, setDragging] = createSignal(false)
  const [offset, setOffset] = createSignal(0) // px toward dismissal (negative = upward / rubber-banded)
  const [settleMs, setSettleMs] = createSignal(200)
  let start = 0
  let size = 320
  let samples: VelocitySample[] = []

  const pos = (e: PointerEvent) => (axis() === "y" ? e.clientY : e.clientX)

  function onDown(e: PointerEvent) {
    if (!props.swipe || childOpen() > 0) return
    const t = e.target as HTMLElement
    if (t.closest("button, a, input, textarea, select, [data-no-swipe]")) return
    const panel = panelRef
    if (!panel) return
    setDragging(true)
    start = pos(e)
    size = axis() === "y" ? panel.offsetHeight : panel.offsetWidth
    samples = [{ t: e.timeStamp, p: pos(e) }]
    panel.setPointerCapture(e.pointerId)
  }
  function onMove(e: PointerEvent) {
    if (!dragging()) return
    samples.push({ t: e.timeStamp, p: pos(e) })
    if (samples.length > 6) samples.shift()
    const d = (pos(e) - start) * dismissSign()
    if (hasSnaps()) {
      // Upward headroom until the largest snap, rubber-band past it.
      const headroom = snapBase()
      setOffset(d >= -headroom ? d : -headroom - rubberband(-d - headroom, size))
    } else {
      setOffset(d >= 0 ? d : -rubberband(-d, size))
    }
  }
  function onUp() {
    if (!dragging()) return
    setDragging(false)
    const v = velocityFrom(samples) * dismissSign()
    // A hard flick settles faster — scale the release duration by swipe strength.
    setSettleMs(Math.round(200 * Math.min(1, Math.max(0.3, 1 - Math.abs(v) / 3000))))
    const projected = offset() + project(v)

    if (hasSnaps()) {
      // Projected visible height picks the snap; below half the smallest = dismiss.
      const projectedVisible = activeSnapPx() - projected
      const snaps = props.snapPoints!
      const smallest = Math.min(...snaps.map(resolveSnap))
      if (projectedVisible < smallest * 0.5) {
        dismiss()
        return
      }
      const nearest = snaps.reduce((a, b) =>
        Math.abs(resolveSnap(b) - projectedVisible) < Math.abs(resolveSnap(a) - projectedVisible) ? b : a,
      )
      setSnap(nearest)
      setOffset(0)
      return
    }

    // Velocity sign decides on a flick; projection decides on a slow drag.
    if (offset() > 0 && (v > 500 || (projected > size * 0.5 && v > -100))) {
      dismiss()
    } else {
      setOffset(0)
    }
  }
  function dismiss() {
    if (pixelPrefersReducedMotion()) {
      setOffset(0)
      props.onClose?.()
      return
    }
    setOffset(size * 1.05)
    window.setTimeout(() => {
      props.onClose?.()
      setOffset(0)
    }, settleMs())
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "Escape" && e.key !== "Esc") return
    e.stopPropagation()
    props.onClose?.()
  }

  /** 0..1 how far the drawer has been swiped toward dismissal. */
  const progress = createMemo(() => {
    const travelled = snapBase() + offset()
    const total = hasSnaps() ? maxSnapPx() : size
    return Math.min(1, Math.max(0, travelled / total))
  })

  const panelStyle = createMemo<JSX.CSSProperties>(() => {
    if (childOpen() > 0) {
      const push = props.side === "bottom" ? "translateY(10px)" : `translateX(${12 * dismissSign()}px)`
      return { transform: `${push} scale(0.97)`, filter: "brightness(0.75)" }
    }
    const style: JSX.CSSProperties = { "transition-duration": `${settleMs()}ms` }
    if (hasSnaps()) style.height = `${maxSnapPx()}px`
    const delta = snapBase() + offset()
    if (delta !== 0) {
      style.transform = axis() === "y" ? `translateY(${delta}px)` : `translateX(${offset() * dismissSign()}px)`
    }
    return style
  })

  /** The panel hears its keys and pointers on itself, never through Solid's
   * delegation, which carries an event out of a portal into the tree that
   * opened it: a nested drawer's Escape or drag must stay its own, as
   * `stopPropagation` and the page's own tree keep them in the Vue kit. */
  function bindPanel(el: HTMLDivElement) {
    panelRef = el
    el.addEventListener("keydown", onKeyDown)
    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointercancel", onUp)
  }

  return (
    <Portal>
      <Presence when={props.open && props.modal} name="dk-fade">
        <div
          aria-hidden="true"
          {...stylex.props(styles.layer)}
          style={{
            opacity: dragging() || offset() > 0 ? 1 - progress() : undefined,
            transition: dragging() ? "none" : undefined,
          }}
          onClick={() => props.dismissible && props.onClose?.()}
        />
      </Presence>
      <Presence
        when={props.open}
        name={props.side === "bottom" ? "dk-slide-b" : props.side === "right" ? "dk-slide-r" : "dk-slide-l"}
      >
        <div
          ref={bindPanel}
          role="dialog"
          aria-modal={props.modal ? "true" : undefined}
          aria-label={props.title}
          class={cn(
            styles.stack,
            props.side === "bottom" ? styles.insetX0 : styles.insetY0,
            props.side === "bottom" && !hasSnaps() ? styles.maxH85dvh : null,
            props.side === "right" ? styles.right0 : props.side === "left" ? styles.left0 : null,
            dragging() ? styles.selectNone : styles.transitionTransformFilter,
            props.swipe && props.side !== "bottom" ? styles.touchPanY : null,
          )}
          style={panelStyle()}
        >
          <Show when={props.side === "bottom"}>
            <div aria-hidden="true" {...stylex.props(styles.box)} />
          </Show>
          {/* A modal drawer holds focus like the kit's dialogs: in on open (the
              close key first), Tab cycling inside, back to its opener on close. */}
          <FocusScope
            autofocus={props.modal}
            trapped={props.modal}
            restoreFocus={props.modal}
            xstyle={styles.focusScope}
          >
            <div {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.text)}>{props.title}</span>
              <button
                type="button"
                {...stylex.props(styles.button)}
                aria-label="Close"
                onClick={() => props.onClose?.()}
              >
                ×
              </button>
            </div>
            <div {...stylex.props(styles.box2)} data-no-swipe={props.side === "bottom" ? true : undefined}>
              <DRAWER_CHANNEL.Provider value={channel}>{props.children}</DRAWER_CHANNEL.Provider>
            </div>
          </FocusScope>
        </div>
      </Presence>
    </Portal>
  )
}
