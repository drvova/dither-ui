import { onCleanup, onMount, untrack } from "solid-js"
import { watch } from "@/entities/editor"

/** A watcher over a getter, for the panel's parts: `changed` some time after
 * the value it returns has changed (with `deep`, anything under it), once
 * for every write of a turn, never for the first read (what the page kept,
 * restored as the panel mounts, is that first read). */
export function watching<T>(source: () => T, changed: (value: T) => void, opts: { deep?: boolean } = {}) {
  let was: T
  onMount(() => (was = untrack(source)))
  onCleanup(
    watch(
      source,
      () => {
        const value = untrack(source)
        if (!opts.deep && Object.is(value, was)) return
        was = value
        changed(value)
      },
      opts,
    ),
  )
}
