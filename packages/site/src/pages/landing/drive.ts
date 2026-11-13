// Art that moves only on cue (the user's brief: no perpetual loops): it is
// driven for a while (`drive(ms)` keeps it moving at least that much
// longer) and settles when the cues stop. The hero's print (a run once
// the brand is home, then the pointer), the bridge's board and the
// footer's road (a dance as each comes into view, then the reader's
// scroll) run on it.
import { type Accessor, createSignal, onCleanup } from "solid-js"

export function useDrive(): {
  driven: Accessor<boolean>
  drive: (ms?: number) => void
  running: () => boolean
} {
  const [driven, setDriven] = createSignal(false)
  let until = 0
  let settle = 0
  /** Keep the art moving for at least `ms` more. */
  function drive(ms = 240) {
    until = Math.max(until, performance.now() + ms)
    setDriven(true)
    clearTimeout(settle)
    settle = window.setTimeout(() => setDriven(false), until - performance.now())
  }
  onCleanup(() => clearTimeout(settle))
  /** Whether a drive is still running. */
  const running = () => until > performance.now()
  return { driven, drive, running }
}
