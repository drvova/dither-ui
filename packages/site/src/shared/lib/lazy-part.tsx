// A part of a page loaded on demand that waits in its own place: `lazy`
// under the page's one Suspense (the app's root) suspended the whole page
// while its chunk loaded, so the page emptied for a moment and the reader
// was thrown back to its top (the landing's bento cards, scrolled into).
// Every lazily loaded part of the site goes through here, which gives it a
// Suspense of its own; `tests/lazy-parts.spec.ts` holds the rule.
import { type Component, type ComponentProps, type JSX, lazy, Suspense } from "solid-js"

export type LazyPart<T extends Component<any>> = ((props: ComponentProps<T>) => JSX.Element) & {
  /** Load the part's chunk ahead of its first mount. */
  preload: () => Promise<{ default: T }>
}

/** `load`'s component, rendered inside its own Suspense: while its chunk
 * loads, only its place waits (holding `fallback`, nothing by default). */
export function lazyPart<T extends Component<any>>(
  load: () => Promise<{ default: T }>,
  fallback?: () => JSX.Element,
): LazyPart<T> {
  const Part = lazy(load)
  const InPlace = (props: ComponentProps<T>) => (
    <Suspense fallback={fallback?.()}>
      <Part {...props} />
    </Suspense>
  )
  return Object.assign(InPlace, { preload: Part.preload })
}
