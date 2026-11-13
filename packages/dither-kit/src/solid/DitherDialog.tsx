import { createEffect, createUniqueId, type JSX, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { Presence } from "./runtime/presence"
import "./DitherDialog.css"

export type DitherDialogProps = {
  open: boolean
  title?: string
  description?: string
  closeOnBackdrop?: boolean
  class?: string
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
    if (e.key !== "Tab") return
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
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6"
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
            class={cn(
              "w-full max-w-md overflow-hidden rounded-xl border border-border/80 bg-card font-mono shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]",
              props.class,
            )}
          >
            <header class="flex min-h-12 items-start justify-between gap-4 border-b border-border/60 px-4 py-3">
              <div class="min-w-0">
                <Show when={props.title}>
                  <h2 id={titleId} class="text-sm font-medium text-foreground">
                    {props.title}
                  </h2>
                </Show>
                <Show when={props.description}>
                  <p id={descriptionId} class="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {props.description}
                  </p>
                </Show>
              </div>
              <button
                ref={(el) => (close = el)}
                type="button"
                class={cn(
                  CONTROL_BUTTON,
                  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                )}
                aria-label="Close"
                onClick={() => props.onClose?.()}
              >
                ×
              </button>
            </header>
            <div class="p-4">{props.children}</div>
            <Show when={props.footer}>
              {(footer) => (
                <footer class="flex justify-end gap-2 border-t border-border/60 px-4 py-3">{footer()}</footer>
              )}
            </Show>
          </section>
        </div>
      </Presence>
    </Portal>
  )
}
