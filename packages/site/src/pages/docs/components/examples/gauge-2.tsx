import { createSignal, onCleanup } from "solid-js"
import { DitherGauge, DitherInView } from "@dither-kit"

export default function Example() {
  // this page's frames a second, its worst frame and its elements in
  // thousands, read every half second while the panel is in view
  const [fps, setFps] = createSignal(0)
  const [worst, setWorst] = createSignal(0)
  const [nodes, setNodes] = createSignal(0)
  let raf = 0
  let stamps: number[] = []
  function measure(now: number) {
    stamps.push(now)
    const span = now - stamps[0]
    if (span >= 500) {
      let longest = 0
      for (let i = 1; i < stamps.length; i++) longest = Math.max(longest, stamps[i] - stamps[i - 1])
      setFps(Math.round(((stamps.length - 1) * 1000) / span))
      setWorst(Math.round(longest * 10) / 10)
      setNodes(document.getElementsByTagName("*").length / 1000)
      stamps = [now]
    }
    raf = requestAnimationFrame(measure)
  }
  const start = () => {
    if (!raf) raf = requestAnimationFrame(measure)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    stamps = []
  }
  onCleanup(stop)

  return (
    <DitherInView once={false} onEnter={start} onLeave={stop}>
      {() => (
        <div class="mx-auto grid max-w-md grid-cols-3 gap-4">
          <DitherGauge value={fps()} max={120} ticks={6} warn={null} label="fps" />
          <DitherGauge value={worst()} max={50} decimals={1} warn={0.66} label="worst ms" />
          <DitherGauge value={nodes()} max={20} decimals={1} label="k elements" />
        </div>
      )}
    </DitherInView>
  )
}
