// Scroll scenes (`./scroll-scene`, framework-free) as Solid takes them:
// `ref={scene(range)}` on the element whose stylesheet reads `--scene`, set
// up once it is in the page and let go with the component.
import { onCleanup, onMount } from "solid-js"
import { scrollScene, type SceneRange } from "@/shared/lib/scroll-scene"

/** A ref that gives its element `range`'s scene. */
export function scene(range: SceneRange): (el: HTMLElement) => void {
  return (el) =>
    onMount(() => {
      const s = scrollScene(el, range)
      onCleanup(() => s.destroy())
    })
}
