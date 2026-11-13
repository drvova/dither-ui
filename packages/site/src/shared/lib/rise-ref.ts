// The rise (`./rise`, framework-free) as Solid takes it: `rise`
// goes on the element that holds the risers as its ref (`ref={rise}`), what
// `v-rise` was. It waits for the mount, so the risers its children render
// are in the element and the element in the page, and lets go of its
// observer with the component.
import { onCleanup, onMount } from "solid-js"
import { rise as riseNode } from "@/shared/lib/rise"

/** Rise what `el` holds (`[data-rise]`) once it comes into view. */
export function rise(el: HTMLElement): void {
  onMount(() => {
    const rising = riseNode(el)
    onCleanup(() => rising.destroy())
  })
}
