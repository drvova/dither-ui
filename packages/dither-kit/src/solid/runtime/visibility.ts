// Solid's binding of `watchVisibility` (`engine/visibility.ts`, where the
// behaviour lives): watched from mount to cleanup. Returns whether the
// element is on screen and under no cover; `onWake` fires as it re-enters.

import { onCleanup, onMount } from "solid-js"
import { watchVisibility } from "../../engine/visibility"

export function createCanvasVisibility(el: () => Element | null | undefined, onWake?: () => void): () => boolean {
  const v = watchVisibility(el, onWake)
  onMount(v.mount)
  onCleanup(v.dispose)
  return v.visible
}
