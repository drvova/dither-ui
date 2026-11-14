import { createSignal, type JSX, mergeProps, onCleanup } from "solid-js"
import { Presence } from "./runtime/presence"
import "./DitherPreviewCard.css"

export type DitherPreviewCardProps = {
  delay?: number
  /** What the card hangs from: hovering or focusing it shows the card. */
  trigger?: JSX.Element
  /** @docs content */
  children?: JSX.Element
}

export default function DitherPreviewCard(raw: DitherPreviewCardProps) {
  const props = mergeProps({ delay: 400 }, raw)

  const [shown, setShown] = createSignal(false)
  let openTimer = 0
  let closeTimer = 0

  function show() {
    clearTimeout(closeTimer)
    clearTimeout(openTimer)
    openTimer = window.setTimeout(() => {
      setShown(true)
    }, props.delay)
  }
  function hide() {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    // small close-delay so moving the pointer into the card keeps it open
    closeTimer = window.setTimeout(() => {
      setShown(false)
    }, 100)
  }
  function keepOpen() {
    clearTimeout(closeTimer)
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
      setShown(false)
    }
  }

  onCleanup(() => {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })

  return (
    <span class="relative inline-block" onKeyDown={onKeydown}>
      <span class="inline-block" onPointerEnter={show} onPointerLeave={hide} onFocusIn={show} onFocusOut={hide}>
        {props.trigger}
      </span>
      <Presence when={shown()} name="dk-pop">
        <div
          class="absolute bottom-full left-1/2 z-30 mb-1.5 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
          onPointerEnter={keepOpen}
          onPointerLeave={hide}
        >
          {props.children}
        </div>
      </Presence>
    </span>
  )
}
