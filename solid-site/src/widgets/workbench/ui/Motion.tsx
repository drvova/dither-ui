// Motion: the preview's CSS and Web animations (play, pause, slow down,
// scrub), and — beyond Kobra — the kit clock that every dithered surface
// runs on: hold it at a moment, step frame by frame, release it. The clock
// is page-wide (every preview on the page holds with it), and says so.
import { createSignal, For, Index, onCleanup, onMount, Show } from "solid-js"
import { directedTime, isDirected, release, seek } from "@dither-kit"
import { labelOf } from "@/shared/lib/inspect/measure"
import { ICONS } from "@/widgets/workbench/model/tools"
import { useBench } from "../context"
import Icon from "./Icon"
import "./Motion.css"

type Row = { anim: Animation; name: string; target: string; duration: number; iterations: string; state: string }
const RATES = [0.1, 0.25, 0.5, 1]
const FRAME = 1000 / 30

function nameOf(a: Animation): string {
  if (typeof CSSAnimation !== "undefined" && a instanceof CSSAnimation) return a.animationName
  if (typeof CSSTransition !== "undefined" && a instanceof CSSTransition) return `transition: ${a.transitionProperty}`
  return a.id || "animation"
}

export default function Motion() {
  const b = useBench()
  const [rows, setRows] = createSignal<Row[]>([])
  const [scrub, setScrub] = createSignal(0)
  const [span, setSpan] = createSignal(1000)
  const [rate, setRate] = createSignal(1)
  const [held, setHeld] = createSignal(isDirected())
  const [at, setAt] = createSignal(directedTime() ?? 0)

  function scan() {
    const list = typeof document.getAnimations === "function" ? document.getAnimations() : []
    setRows(
      list
        .filter((a) => {
          const t = (a.effect as KeyframeEffect | null)?.target
          return t instanceof Element && b.o.content.contains(t)
        })
        .map((a) => {
          const timing = a.effect!.getComputedTiming()
          const el = (a.effect as KeyframeEffect).target as Element
          return {
            anim: a,
            name: nameOf(a),
            target: labelOf(el),
            duration: Number(timing.duration) || 0,
            iterations: timing.iterations === Infinity ? "∞" : String(timing.iterations),
            state: a.playState,
          }
        }),
    )
    setSpan(Math.max(1000, ...rows().map((r) => r.duration)))
  }

  onMount(() => {
    scan()
    const timer = window.setInterval(scan, 600)
    onCleanup(() => clearInterval(timer))
  })

  function playAll(play: boolean) {
    for (const r of rows()) play ? r.anim.play() : r.anim.pause()
    scan()
    b.say(play ? "Animations playing" : "Animations paused")
  }

  function pace(v: number) {
    setRate(v)
    for (const r of rows()) r.anim.updatePlaybackRate(v)
    b.say(`Playback at ${v}×`)
  }

  function seekAll(ms: number) {
    setScrub(ms)
    for (const r of rows()) {
      r.anim.pause()
      const end = Number(r.anim.effect?.getComputedTiming().endTime)
      r.anim.currentTime = Number.isFinite(end) ? Math.min(ms, end) : ms
    }
    scan()
  }

  function hold(ms: number) {
    setAt(Math.max(0, ms))
    seek(at())
    setHeld(true)
  }

  function free() {
    release()
    setHeld(false)
    b.say("Kit clock released")
  }

  return (
    <section class="wb-motion motion-scope" aria-label="Motion">
      <header class="row">
        <span class="micro">Motion</span>
        <span class="dim">
          {rows().length} animation{rows().length === 1 ? "" : "s"} in this preview
        </span>
        <span class="spacer" />
        <button type="button" class="act" aria-label="Play every animation" onClick={() => playAll(true)}>
          <Icon d={ICONS.play} size={12} />
        </button>
        <button type="button" class="act" aria-label="Pause every animation" onClick={() => playAll(false)}>
          <Icon d={ICONS.pause} size={12} />
        </button>
        <div class="seg" role="group" aria-label="Playback rate">
          <For each={RATES}>
            {(r) => (
              <button type="button" aria-pressed={rate() === r} onClick={() => pace(r)}>
                {r}×
              </button>
            )}
          </For>
        </div>
      </header>
      <Show when={rows().length}>
        <label class="row scrub">
          <span class="dim">scrub</span>
          <input
            type="range"
            min="0"
            max={span()}
            step="1"
            value={scrub()}
            aria-label="Scrub every animation"
            onInput={(e) => seekAll(+e.currentTarget.value)}
          />
          <span class="num">{(scrub() / 1000).toFixed(2)} s</span>
        </label>
      </Show>
      <Show
        when={rows().length}
        fallback={<p class="dim">No CSS or Web animations here. Canvas surfaces run on the kit clock below.</p>}
      >
        <table class="list">
          <thead>
            <tr>
              <th class="micro">Animation</th>
              <th class="micro">On</th>
              <th class="micro">Duration</th>
              <th class="micro">Loops</th>
              <th class="micro">State</th>
            </tr>
          </thead>
          <tbody>
            <Index each={rows()}>
              {(r) => (
                <tr>
                  <td>{r().name}</td>
                  <td class="dim">{r().target}</td>
                  <td>{r().duration} ms</td>
                  <td>{r().iterations}</td>
                  <td class="dim">{r().state}</td>
                </tr>
              )}
            </Index>
          </tbody>
        </table>
      </Show>
      <div class="clock">
        <div class="row">
          <span class="micro">Kit clock</span>
          <span class="dim">
            Every dithered surface on the page, {held() ? `held at ${(at() / 1000).toFixed(3)} s` : "running"}
          </span>
          <span class="spacer" />
          <button type="button" class="act" aria-label="Back one frame" onClick={() => hold(at() - FRAME)}>
            <Icon d={ICONS.back} size={12} />
          </button>
          <button type="button" class="act" aria-pressed={held()} onClick={() => (held() ? free() : hold(at()))}>
            <Icon d={held() ? ICONS.play : ICONS.pause} size={12} /> {held() ? "Release" : "Hold"}
          </button>
          <button type="button" class="act" aria-label="Forward one frame" onClick={() => hold(at() + FRAME)}>
            <Icon d={ICONS.step} size={12} />
          </button>
        </div>
        <label class="row scrub">
          <span class="dim">time</span>
          <input
            type="range"
            min="0"
            max="10000"
            step="1"
            value={at()}
            aria-label="Kit clock time"
            onInput={(e) => hold(+e.currentTarget.value)}
          />
          <span class="num">{(at() / 1000).toFixed(3)} s</span>
        </label>
      </div>
    </section>
  )
}
