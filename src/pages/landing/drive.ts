// Art that moves only on cue (the user's brief: no perpetual loops): it is
// driven for a while (`drive(ms)` keeps it moving at least that much
// longer) and settles when the cues stop. The footer's road and the
// bridge's board run on it: a dance as each comes into view, then the
// reader's scroll.
import { onBeforeUnmount, ref } from "vue"

export function useDrive() {
  const driven = ref(false)
  let until = 0
  let settle = 0
  /** Keep the art moving for at least `ms` more. */
  function drive(ms = 240) {
    until = Math.max(until, performance.now() + ms)
    driven.value = true
    clearTimeout(settle)
    settle = window.setTimeout(() => (driven.value = false), until - performance.now())
  }
  onBeforeUnmount(() => clearTimeout(settle))
  /** Whether a drive is still running. */
  const running = () => until > performance.now()
  return { driven, drive, running }
}
