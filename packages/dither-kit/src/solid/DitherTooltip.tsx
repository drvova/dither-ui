import { createSignal, type JSX, mergeProps, onCleanup } from "solid-js"
import { Presence } from "./runtime/presence"
import "./DitherTooltip.css"

export type DitherTooltipProps = {
  text: string
  delay?: number
  children?: JSX.Element
}

export default function DitherTooltip(raw: DitherTooltipProps) {
  const props = mergeProps({ delay: 300 }, raw)

  const [shown, setShown] = createSignal(false)
  let timer = 0

  function show() {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      setShown(true)
    }, props.delay)
  }
  function hide() {
    clearTimeout(timer)
    setShown(false)
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") hide()
  }

  onCleanup(() => clearTimeout(timer))

  return (
    <span
      class="relative inline-block"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
      onKeyDown={onKeydown}
    >
      {props.children}
      <Presence when={shown()} name="dk-tip">
        <span
          role="tooltip"
          class="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 rounded border border-border bg-card px-2 py-1 text-[11px] whitespace-nowrap text-foreground"
        >
          {props.text}
        </span>
      </Presence>
    </span>
  )
}
