// The glide (`./glide`, framework-free) as Solid takes it: `glide` goes on
// the element that holds the links as its ref (`ref={glide}`), set up once
// it is in the page and let go with the component.
import { onCleanup, onMount } from "solid-js"
import { glide as glideNode } from "@/shared/lib/glide"

/** One ground travelling under the pointer across `el`'s links. */
export function glide(el: HTMLElement): void {
  onMount(() => {
    const g = glideNode(el)
    onCleanup(() => g.destroy())
  })
}
