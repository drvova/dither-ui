// The build: the brand as a model (`build.ts`, every cell of the lockup a
// block, standing on a floor of tiles that lays itself first) raised by the kit's world engine as the page scrolls past it. A
// tall run holds the stage pinned while the scroll drives it (`stageAt`):
// the dotted cage, the cells landing hot in the ember from the bottom up,
// the whole turning, then the cells coming apart as the page leaves. A
// pointer over it leans the cells away; a drag turns it. It moves only
// when the reader does: the surface holds still a beat after the last
// scroll or pointer move. Reduced motion gets the lockup whole and still.
import { createSignal, onCleanup, onMount } from "solid-js"
import { BUILD_CELLS, BUILD_HEAT, lockupModel, stageAt } from "@/pages/landing/build"
import { DitherWorld } from "./parts"
import "./BrandBuild.css"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"

const MODEL = lockupModel()
/** The brand in metal, lit low-key: the shadowed sides sink into the
 * obsidian, the lit faces climb through graphite and titanium to chrome
 * and bone. */
const RAMP = ["#101214", "#1d2023", "#3a3e43", "#6f747a", "#a6abb1", "#d4dce1", "#e4e1d8"]

export default function BrandBuild() {
  let run: HTMLDivElement | undefined
  const [still, setStill] = createSignal(false)
  const [stage, setStage] = createSignal(stageAt(0.6))
  const [awake, setAwake] = createSignal(false)
  const [zoom, setZoom] = createSignal(1)

  /** The camera frames the model's bounding sphere in the stage's shorter
   * side; the lockup is long and flat, so on a wide stage it zooms in until
   * the word nearly spans it, and on a narrow one it stays framed whole. */
  function fit() {
    const box = run?.firstElementChild?.getBoundingClientRect()
    if (box && box.height > 0) setZoom(Math.min(1.75, Math.max(1, (box.width / box.height) * 0.92)))
  }

  let io: IntersectionObserver | null = null
  let near = false
  let frame = 0
  let sleep: ReturnType<typeof setTimeout> | undefined

  function measure() {
    frame = 0
    const el = run
    if (!el) return
    const r = el.getBoundingClientRect()
    fit()
    // 0 as the run's top reaches the viewport's top, 1 as its foot leaves.
    const travel = Math.max(1, r.height - window.innerHeight)
    setStage(stageAt(-r.top / travel))
  }

  /** The reader moved: paint while they do, hold still a beat after. */
  function stir() {
    setAwake(true)
    clearTimeout(sleep)
    sleep = setTimeout(() => setAwake(false), 1200)
    if (!frame) frame = requestAnimationFrame(measure)
  }

  function onScroll() {
    if (near) stir()
  }

  onMount(() => {
    onCleanup(() => {
      io?.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", fit)
      cancelAnimationFrame(frame)
      clearTimeout(sleep)
    })
    setStill(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
    window.addEventListener("resize", fit, { passive: true })
    // The first reading waits for the frame: read here, mid-mount, it forced
    // a layout of the page that the rest of the mount then undid (measured,
    // about 190ms of a 4x-throttled landing load); in the frame it is the
    // frame's own layout.
    if (still()) {
      setStage({ build: 1, scatter: 0, yaw: -14 })
      frame = requestAnimationFrame(() => ((frame = 0), fit()))
      return
    }
    frame = requestAnimationFrame(measure)
    if (typeof IntersectionObserver !== "undefined" && run) {
      io = new IntersectionObserver((entries) => {
        const e = latestEntry(entries)
        near = !!e?.isIntersecting
        if (near) stir()
      })
      io.observe(run)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
  })

  return (
    <div ref={(el) => (run = el)} class="brand-build-scope build-run" classList={{ still: still() }}>
      <div class="build-stage" onPointerMove={stir} onPointerDown={stir}>
        <DitherWorld
          source={MODEL}
          format="vrml"
          colors={RAMP}
          heat={BUILD_HEAT}
          build={stage().build}
          scatter={stage().scatter}
          yaw={stage().yaw}
          pitch={22}
          zoom={zoom()}
          fov={30}
          autoRotate={0}
          fog={0.25}
          grain={0.22}
          grainScale={9}
          cell={3}
          nudge={!still()}
          paused={still() || !awake()}
          engine="cpu"
          label={`The dither-ui mark and wordmark in ${BUILD_CELLS} cells on a tiled floor, built by the kit's world engine as the page scrolls`}
          class="h-full w-full"
        />
      </div>
    </div>
  )
}
