// Generated from @dither-ui/kit/solid/DitherAlertDialog.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { focusablesIn, trapKeys } from "@dither-ui/kit/engine/keys.ts"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import DitherButton from "./DitherButton"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/DitherAlertDialog.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "color-mix(in oklab, #000 65%, transparent)",
    padding: "1.5rem",
  },
  box: {
    width: "100%",
    maxWidth: "28rem",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 80%, transparent)",
    backgroundColor: "var(--card)",
    fontFamily: "var(--font-mono)",
    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.8)",
  },
  box2: { paddingInline: "1rem", paddingTop: "1rem" },
  text: { fontSize: "0.875rem", lineHeight: "calc(1.25 / 0.875)", fontWeight: "500" },
  p: { marginTop: "0.5rem", fontSize: "13px", lineHeight: "1.625", color: "var(--muted-foreground)" },
  row2: { display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "1rem" },
  button: {
    minHeight: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})

export type DitherAlertDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export default function DitherAlertDialog(raw: DitherAlertDialogProps) {
  const props = mergeProps({ confirmLabel: "Confirm", cancelLabel: "Cancel", danger: false }, raw)

  let panel: HTMLDivElement | undefined
  let cancel: HTMLButtonElement | undefined
  let previousFocus: HTMLElement | null = null
  function onKeydown(e: KeyboardEvent) {
    trapKeys(e, focusablesIn(panel), () => props.onCancel?.())
  }
  onMount(() => {
    createEffect(
      on(
        () => props.open,
        (open) => {
          if (open) {
            previousFocus = document.activeElement as HTMLElement | null
            queueMicrotask(() => cancel?.focus())
          } else {
            const restore = previousFocus
            previousFocus = null
            queueMicrotask(() => restore?.focus())
          }
        },
      ),
    )
    onCleanup(() => previousFocus?.focus())
  })

  return (
    <Portal>
      <Presence when={props.open} name="dk-fade">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={props.title}
          class={cn(styles.row, "dk-alert-dialog")}
          onPointerDown={(e) => e.target === e.currentTarget && props.onCancel?.()}
          onKeyDown={onKeydown}
        >
          <div ref={(el) => (panel = el)} {...stylex.props(styles.box)}>
            <div {...stylex.props(styles.box2)}>
              <span {...stylex.props(styles.text)}>{props.title}</span>
              <Show when={props.description}>
                <p {...stylex.props(styles.p)}>{props.description}</p>
              </Show>
            </div>
            <div {...stylex.props(styles.row2)}>
              <button
                ref={(el) => (cancel = el)}
                type="button"
                class={cn(CONTROL_BUTTON, styles.button)}
                onClick={() => props.onCancel?.()}
              >
                {props.cancelLabel}
              </button>
              <DitherButton color={props.danger ? "red" : "blue"} onClick={() => props.onConfirm?.()}>
                {props.confirmLabel}
              </DitherButton>
            </div>
          </div>
        </div>
      </Presence>
    </Portal>
  )
}
