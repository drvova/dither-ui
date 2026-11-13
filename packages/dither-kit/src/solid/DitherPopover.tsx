import { createEffect, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { Presence } from "./runtime/presence"
import "./DitherPopover.css"

export type DitherPopoverProps = {
  open: boolean
  align?: "start" | "center" | "end"
  onClose?: () => void
  /** What opens the popover; it stays in the flow. */
  trigger?: JSX.Element
  children?: JSX.Element
}

const ALIGN: Record<string, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
}

export default function DitherPopover(raw: DitherPopoverProps) {
  const props = mergeProps({ align: "start" as const }, raw)
  let rootRef: HTMLDivElement | undefined

  function onOutside(e: PointerEvent) {
    if (rootRef?.contains(e.target as Node)) return
    props.onClose?.()
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") props.onClose?.()
  }

  onMount(() => {
    let timer = 0
    createEffect(
      on(
        () => props.open,
        (v) => {
          if (v) {
            // defer so the opening click doesn't immediately close it
            timer = window.setTimeout(() => {
              window.addEventListener("pointerdown", onOutside)
              window.addEventListener("keydown", onKey)
            }, 0)
          } else {
            clearTimeout(timer)
            window.removeEventListener("pointerdown", onOutside)
            window.removeEventListener("keydown", onKey)
          }
        },
        { defer: true },
      ),
    )
    onCleanup(() => {
      clearTimeout(timer)
      window.removeEventListener("pointerdown", onOutside)
      window.removeEventListener("keydown", onKey)
    })
  })

  return (
    <div ref={(el) => (rootRef = el)} class="relative inline-block">
      {props.trigger}
      <Presence when={props.open} name="dk-pop">
        <div
          class={`absolute top-full z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] ${ALIGN[props.align]}`}
        >
          {props.children}
        </div>
      </Presence>
    </div>
  )
}
