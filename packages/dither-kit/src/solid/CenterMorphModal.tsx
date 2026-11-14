import { createEffect, type JSX, mergeProps, on, onCleanup } from "solid-js"
import { Portal } from "solid-js/web"
import { focusablesIn, trapKeys } from "../engine/keys"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { Presence } from "./runtime/presence"
import "./CenterMorphModal.css"

export type CenterMorphModalProps = {
  open: boolean
  label?: string
  closeOnBackdrop?: boolean
  class?: string
  onClose?: () => void
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
          class="fixed inset-0 z-50 bg-black/65 p-4 sm:p-6"
          on:pointerdown={(e) => e.target === e.currentTarget && props.closeOnBackdrop && props.onClose?.()}
          on:keydown={onKeydown}
        >
          <section
            ref={(el) => (panel = el)}
            role="dialog"
            aria-modal="true"
            aria-label={props.label}
            class={cn(
              "dk-cmm-panel relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card font-mono shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]",
              props.class,
            )}
          >
            <button
              ref={(el) => (close = el)}
              type="button"
              class={cn(
                CONTROL_BUTTON,
                "absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-md border border-border/70 bg-background/85 text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
              )}
              aria-label="Close"
              onClick={() => props.onClose?.()}
            >
              ×
            </button>
            <div class="min-h-0 flex-1 overflow-auto p-6">{props.children}</div>
          </section>
        </div>
      </Presence>
    </Portal>
  )
}
