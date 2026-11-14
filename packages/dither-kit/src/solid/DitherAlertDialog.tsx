import { createEffect, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { focusablesIn, trapKeys } from "../engine/keys"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import DitherButton from "./DitherButton"
import { Presence } from "./runtime/presence"
import "./DitherAlertDialog.css"

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
          class="dk-alert-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6"
          onPointerDown={(e) => e.target === e.currentTarget && props.onCancel?.()}
          onKeyDown={onKeydown}
        >
          <div
            ref={(el) => (panel = el)}
            class="w-full max-w-md rounded-xl border border-border/80 bg-card font-mono shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
          >
            <div class="px-4 pt-4">
              <span class="text-sm font-medium">{props.title}</span>
              <Show when={props.description}>
                <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">{props.description}</p>
              </Show>
            </div>
            <div class="flex justify-end gap-2 p-4">
              <button
                ref={(el) => (cancel = el)}
                type="button"
                class={cn(
                  CONTROL_BUTTON,
                  "min-h-10 rounded-md border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                )}
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
