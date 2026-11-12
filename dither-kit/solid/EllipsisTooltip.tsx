import { createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { Dynamic } from "solid-js/web"
import { cn } from "../tailwind/lib"

export type EllipsisTooltipProps = { as?: string; enabled?: boolean; class?: string; children?: JSX.Element }

/** Truncation with the tooltip attached only when it earns it: observes its
 * own overflow (ResizeObserver, no forced reads) and — clipped — publishes the
 * full text of its children as `title`. Unclipped content gets no tooltip at
 * all, which is the point. Degraded engines just render the text. */
export default function EllipsisTooltip(raw: EllipsisTooltipProps) {
  const props = mergeProps({ as: "span", enabled: true }, raw)

  let root: HTMLElement | undefined
  const [clipped, setClipped] = createSignal(false)
  const [full, setFull] = createSignal("")

  function measure() {
    const el = root
    if (!el || !props.enabled) {
      setClipped(false)
      return
    }
    setFull((el.textContent || "").trim())
    setClipped(el.scrollWidth > el.clientWidth + 1)
  }

  onMount(() => {
    measure()
    if (typeof ResizeObserver === "undefined" || !root) return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    onCleanup(() => ro.disconnect())
  })

  return (
    <Dynamic
      component={props.as}
      ref={(el: HTMLElement) => (root = el)}
      title={clipped() ? full() : undefined}
      class={cn("block truncate", props.class)}
    >
      {props.children}
    </Dynamic>
  )
}
