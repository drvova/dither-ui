// Generated from @dither-ui/kit/solid/InView.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { type StyleProp } from "./lib"

export type InViewProps = {
  rootMargin?: string
  threshold?: number
  once?: boolean
  /** Declared for callers that pass one; not applied (the wrapper has no box). */
  class?: string
  xstyle?: StyleProp
  onEnter?: () => void
  onLeave?: () => void
  /** Given the scope: `inView` reads live. */
  children?: (scope: { readonly inView: boolean }) => JSX.Element
}

/** The taxonomy's IntersectionObserver primitive, named for what it does:
 * scoped visibility. `once` (default) latches after the first enter —
 * the lazy-reveal shape every section of this site's docs uses. Without
 * IntersectionObserver the children render as always-in-view, so degraded
 * engines see content instead of an empty box. */
export default function InView(raw: InViewProps) {
  const props = mergeProps({ rootMargin: "200px", threshold: 0, once: true }, raw)

  let root: HTMLDivElement | undefined
  const [inView, setInView] = createSignal(typeof IntersectionObserver === "undefined")
  let io: IntersectionObserver | null = null
  let done = false

  function connect() {
    if (inView() || typeof IntersectionObserver === "undefined" || !root) return
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            props.onEnter?.()
            if (props.once) {
              io?.disconnect()
              io = null
              done = true
            }
          } else if (!props.once && !done) {
            setInView(false)
            props.onLeave?.()
          }
        }
      },
      { rootMargin: props.rootMargin, threshold: props.threshold },
    )
    io.observe(root)
  }

  onMount(() => {
    connect()
    onCleanup(() => {
      io?.disconnect()
      io = null
    })
  })

  const scope = {
    get inView() {
      return inView()
    },
  }
  return <div ref={(el) => (root = el)}>{props.children?.(scope)}</div>
}
