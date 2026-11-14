// Generated from @dither-ui/kit/solid/DitherDialog.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createUniqueId, type JSX, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { isTab } from "@dither-ui/kit/engine/keys.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/DitherDialog.css"
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
  header: {
    display: "flex",
    minHeight: "3rem",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
  },
  box: { minWidth: "0px" },
  h2: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
    color: "var(--foreground)",
  },
  p: { marginTop: "0.25rem", fontSize: "12px", lineHeight: "1.625", color: "var(--muted-foreground)" },
  box2: { padding: "1rem" },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
  },
  section: {
    width: "100%",
    maxWidth: "28rem",
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
    display: "flex",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
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

export type DitherDialogProps = {
  open: boolean
  title?: string
  description?: string
  closeOnBackdrop?: boolean
  class?: string
  xstyle?: StyleProp
  onClose?: () => void
  footer?: JSX.Element
  children?: JSX.Element
}

export default function DitherDialog(raw: DitherDialogProps) {
  const props = mergeProps({ closeOnBackdrop: true }, raw)
  let panel: HTMLElement | undefined
  let close: HTMLButtonElement | undefined
  // One id per instance, so two open dialogs never share a label.
  const idBase = `dk-dialog-${createUniqueId()}`
  const titleId = `${idBase}-title`
  const descriptionId = `${idBase}-description`
  let previousFocus: HTMLElement | null = null

  const focusable = () => [
    ...(panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []),
  ]
  function focusInitial() {
    close?.focus() ?? focusable()[0]?.focus()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      props.onClose?.()
      return
    }
    if (!isTab(e)) return
    const items = focusable()
    if (!items.length) return e.preventDefault()
    const first = items[0],
      last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  onMount(() => {
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
  })

  return (
    <Portal>
      <Presence when={props.open} name="dk-dialog">
        <div
          {...stylex.props(styles.row)}
          onPointerDown={(e) => e.target === e.currentTarget && props.closeOnBackdrop && props.onClose?.()}
          onKeyDown={onKeydown}
        >
          <section
            ref={(el) => (panel = el)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={props.title ? titleId : undefined}
            aria-label={props.title ? undefined : "Dialog"}
            aria-describedby={props.description ? descriptionId : undefined}
            class={cn(styles.section, props.xstyle, props.class)}
          >
            <header {...stylex.props(styles.header)}>
              <div {...stylex.props(styles.box)}>
                <Show when={props.title}>
                  <h2 id={titleId} {...stylex.props(styles.h2)}>
                    {props.title}
                  </h2>
                </Show>
                <Show when={props.description}>
                  <p id={descriptionId} {...stylex.props(styles.p)}>
                    {props.description}
                  </p>
                </Show>
              </div>
              <button
                ref={(el) => (close = el)}
                type="button"
                class={cn(CONTROL_BUTTON, styles.button)}
                aria-label="Close"
                onClick={() => props.onClose?.()}
              >
                ×
              </button>
            </header>
            <div {...stylex.props(styles.box2)}>{props.children}</div>
            <Show when={props.footer}>{(footer) => <footer {...stylex.props(styles.footer)}>{footer()}</footer>}</Show>
          </section>
        </div>
      </Presence>
    </Portal>
  )
}
