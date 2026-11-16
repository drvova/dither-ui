// Generated from @dither-ui/kit/solid/CenterMorphModal.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, type JSX, mergeProps, on, onCleanup } from "solid-js"
import { Portal } from "solid-js/web"
import { focusablesIn, trapKeys } from "@dither-ui/kit/engine/keys.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/CenterMorphModal.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    backgroundColor: "color-mix(in oklab, #000 65%, transparent)",
    padding: { default: "1rem", "@media (width >= 40rem)": "1.5rem" },
  },
  box: { minHeight: "0px", flex: "1", overflow: "auto", padding: "1.5rem" },
  section: {
    position: "relative",
    display: "flex",
    height: "100%",
    width: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
    backgroundColor: "var(--card)",
    fontFamily: "var(--font-mono)",
    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
  },
  button: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    zIndex: "10",
    display: "flex",
    width: "2rem",
    height: "2rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 85%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})

export type CenterMorphModalProps = {
  open: boolean
  /** @docs string (accessible name) */
  label?: string
  closeOnBackdrop?: boolean
  class?: string
  xstyle?: StyleProp
  onClose?: () => void
  /** @docs content */
  children?: JSX.Element
}

export default function CenterMorphModal(raw: CenterMorphModalProps) {
  const props = mergeProps({ label: "Modal", closeOnBackdrop: true }, raw)
  let panel: HTMLElement | undefined
  let close: HTMLButtonElement | undefined
  let previousFocus: HTMLElement | null = null

  const focusable = () => focusablesIn(panel)
  function focusInitial() {
    close?.focus()
    focusable()[0]?.focus()
  }
  function onKeydown(e: KeyboardEvent) {
    trapKeys(e, focusable(), () => props.onClose?.())
  }
  createEffect(
    on(
      () => props.open,
      (open) => {
        if (open) {
          previousFocus = document.activeElement as HTMLElement | null
          queueMicrotask(focusInitial)
        } else {
          const restore = previousFocus
          previousFocus = null
          queueMicrotask(() => restore?.focus())
        }
      },
    ),
  )
  onCleanup(() => previousFocus?.focus())

  return (
    <Portal>
      <Presence when={props.open} name="dk-cmm">
        {/* Native listeners: the Escape that closes it must stop at the sheet. */}
        <div
          {...stylex.props(styles.layer)}
          on:pointerdown={(e) => e.target === e.currentTarget && props.closeOnBackdrop && props.onClose?.()}
          on:keydown={onKeydown}
        >
          <section
            ref={(el) => (panel = el)}
            role="dialog"
            aria-modal="true"
            aria-label={props.label}
            class={cn([styles.section, "dk-cmm-panel"], props.xstyle, props.class)}
          >
            <button
              ref={(el) => (close = el)}
              type="button"
              class={cn(CONTROL_BUTTON, styles.button)}
              aria-label="Close"
              onClick={() => props.onClose?.()}
            >
              ×
            </button>
            <div {...stylex.props(styles.box)}>{props.children}</div>
          </section>
        </div>
      </Presence>
    </Portal>
  )
}
