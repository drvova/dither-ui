import { onBeforeUnmount, onMounted, type Ref } from "vue"
import { watchVisibility } from "./visibility"

/**
 * Vue's binding of `watchVisibility` (`visibility.ts`, where the behaviour
 * lives): watched from mount to unmount. Returns whether the element is on
 * screen and under no cover; `onWake` fires when it re-enters view.
 */
export function useCanvasVisibility(el: Ref<HTMLElement | null>, onWake?: () => void): () => boolean {
  const v = watchVisibility(() => el.value, onWake)
  onMounted(v.mount)
  onBeforeUnmount(v.dispose)
  return v.visible
}
