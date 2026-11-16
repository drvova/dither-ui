// Generated from @dither-ui/kit/solid/DitherDrawer.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
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
import { project, velocityFrom, type VelocitySample } from "@dither-ui/kit/engine/gesture.ts"
import { cn } from "./lib"
import FocusScope from "./FocusScope"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/DitherDrawer.css"
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
  box3: {
    transitionProperty: { default: "transform, filter", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
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
  /** @default undefined */
  title?: string
  /** Swipe-to-dismiss gesture on the panel: where the swipe would carry it
   * decides, as it is let go (the panel does not follow the finger).
   * @docs boolean: swipe to dismiss, momentum decides */
  swipe?: boolean
  /** Bottom sheets only: preset visible heights (0..1 viewport fraction, >1 px).
   * @docs number[]: ≤1 vh fraction, >1 px (bottom)
   * @default undefined */
  snapPoints?: number[]
  /** Active snap point (with `onUpdateSnapPoint`). Defaults to the first.
   * @docs number (with onUpdateSnapPoint)
   * @default first snap */
  snapPoint?: number
  /** false renders no backdrop and leaves the page interactive.
   * @docs boolean (false: no backdrop, page stays live) */
  modal?: boolean
  /** false keeps the drawer open on backdrop clicks (Escape still closes).
   * @docs boolean (false: backdrop click ignored) */
  dismissible?: boolean
  onClose?: () => void
  onUpdateSnapPoint?: (snap: number) => void
  /** @docs content */
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

  // --- swipe: read as it is let go, momentum projected -----------------------
  const axis = createMemo(() => (props.side === "bottom" ? "y" : "x"))
  const dismissSign = createMemo(() => (props.side === "left" ? -1 : 1))
  let swiping = false
  let start = 0
  let samples: VelocitySample[] = []

  const pos = (e: PointerEvent) => (axis() === "y" ? e.clientY : e.clientX)

  function onDown(e: PointerEvent) {
    if (!props.swipe || childOpen() > 0) return
    const t = e.target as HTMLElement
    if (t.closest("button, a, input, textarea, select, [data-no-swipe]")) return
    const panel = panelRef
    if (!panel) return
    swiping = true
    start = pos(e)
    samples = [{ t: e.timeStamp, p: pos(e) }]
    panel.setPointerCapture(e.pointerId)
  }
  function onMove(e: PointerEvent) {
    if (!swiping) return
    samples.push({ t: e.timeStamp, p: pos(e) })
    if (samples.length > 6) samples.shift()
  }
  function onUp(e: PointerEvent) {
    if (!swiping) return
    swiping = false
    const panel = panelRef
    const size = panel ? (axis() === "y" ? panel.offsetHeight : panel.offsetWidth) : 320
    const v = velocityFrom(samples) * dismissSign()
    // how far toward dismissal it went, and where its momentum carries it
    const travelled = (pos(e) - start) * dismissSign()
    const projected = travelled + project(v)

    if (hasSnaps()) {
      // Projected visible height picks the snap; below half the smallest = dismiss.
      const projectedVisible = activeSnapPx() - projected
      const snaps = props.snapPoints!
      const smallest = Math.min(...snaps.map(resolveSnap))
      if (projectedVisible < smallest * 0.5) return props.onClose?.()
      setSnap(
        snaps.reduce((a, b) =>
          Math.abs(resolveSnap(b) - projectedVisible) < Math.abs(resolveSnap(a) - projectedVisible) ? b : a,
        ),
      )
      return
    }
    // Velocity sign decides on a flick; projection decides on a slow swipe.
    if (travelled > 0 && (v > 500 || (projected > size * 0.5 && v > -100))) props.onClose?.()
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "Escape" && e.key !== "Esc") return
    e.stopPropagation()
    props.onClose?.()
  }

  const panelStyle = createMemo<JSX.CSSProperties>(() => {
    if (childOpen() > 0) {
      const push = props.side === "bottom" ? "translateY(10px)" : `translateX(${12 * dismissSign()}px)`
      return { transform: `${push} scale(0.97)`, filter: "brightness(0.75)" }
    }
    if (!hasSnaps()) return {}
    // the resting snap: everything below it hidden, moved there by the
    // panel's transition
    return { height: `${maxSnapPx()}px`, transform: snapBase() ? `translateY(${snapBase()}px)` : undefined }
  })

  /** The panel hears its keys and pointers on itself, never through Solid's
   * delegation, which carries an event out of a portal into the tree that
   * opened it: a nested drawer's Escape or drag must stay its own. */
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
            styles.box3,
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
