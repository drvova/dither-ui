import { type JSX, onCleanup, onMount, splitProps } from "solid-js"

/** Reports its own box size: renders the slot in a plain block and emits
 * `resize` with `{ width, height }` whenever the box changes (first
 * observation included). ResizeObserver-only — without it (jsdom, ancient
 * engines) it simply renders and stays silent rather than guessing. `class`
 * and other attrs fall through to the block untouched. */
export type MeasureProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "onResize"> & {
  /** @docs ({ width, height }) => void
   * @default on box change */
  onResize?: (size: { width: number; height: number }) => void
}

export default function Measure(raw: MeasureProps) {
  const [props, rest] = splitProps(raw, ["onResize", "children"])
  let root: HTMLDivElement | undefined

  onMount(() => {
    if (typeof ResizeObserver === "undefined" || !root) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        props.onResize?.({ width: Math.round(e.contentRect.width), height: Math.round(e.contentRect.height) })
      }
    })
    ro.observe(root)
    onCleanup(() => ro.disconnect())
  })

  return (
    <div {...rest} ref={(el) => (root = el)}>
      {props.children}
    </div>
  )
}
