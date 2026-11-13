// The ask as a story: a stage pinned while the page scrolls past it plays
// one agent session (`story.ts`), a step per notch. Composed as a product
// shot, corner bleed: the session sits at the left like copy beside a hero
// (the ask as the sent message, then what the agent does, the line at work
// under a spinner, the done ones checked), and the Deploys screen it lays
// out is the hero at the right, inset a gutter from the stage's top and left
// and running off its right and bottom edges, where only the chart (filler
// that reads when cut) goes. The screen is never blank: each part's slot
// holds its place, and the parts resolve in their slots top to bottom as
// the agent lays them out. The step is the marker crossing the viewport's
// middle (one IntersectionObserver, no scroll listener). Under 900px, or
// without an observer, the stage is not pinned and shows the last step, the
// whole session and screen. Screen readers get the whole session as a
// caption; the stage that plays it is decoration.
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import {
  DitherIcon,
  DitherNumberText,
  DitherProgress,
  DitherSpinner,
  DitherSwitch,
  DitherText,
  Sparkline,
} from "@dither-ui/kit"
import { ASK, DAYS, DEPLOYS, DOES, lineState, PARTS, RENDER, STEPS } from "@/pages/landing/story"
import "./AgentStory.css"

const LAST = STEPS - 1
const TOLD = DOES.map((d) => d[0].toLowerCase() + d.slice(1))
const NOTCHES = Array.from({ length: STEPS }, (_, i) => i)

export default function AgentStory() {
  const [step, setStep] = createSignal(LAST)
  const [pinned, setPinned] = createSignal(false)
  const [auto, setAuto] = createSignal(true)

  const markers: HTMLElement[] = []
  let io: IntersectionObserver | null = null
  let wide: MediaQueryList | null = null
  const inBand = new Set<number>()

  async function arm() {
    io?.disconnect()
    io = null
    inBand.clear()
    setPinned(typeof IntersectionObserver !== "undefined" && (wide?.matches ?? false))
    if (!pinned()) {
      setStep(LAST)
      return
    }
    setStep(0)
    // The markers render with the pin: observe them once they are there.
    await Promise.resolve()
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = markers.indexOf(e.target as HTMLElement)
          if (i < 0) continue
          if (e.isIntersecting) inBand.add(i)
          else inBand.delete(i)
        }
        if (inBand.size) setStep(Math.max(...inBand))
      },
      { rootMargin: "-50% 0px -50% 0px" },
    )
    for (const m of markers) io.observe(m)
  }

  onMount(() => {
    wide = window.matchMedia("(min-width: 900px)")
    wide.addEventListener("change", arm)
    void arm()
    onCleanup(() => {
      wide?.removeEventListener("change", arm)
      io?.disconnect()
    })
  })

  const render = () => lineState(RENDER, step())

  return (
    <div class="agent-story-scope story" classList={{ pinned: pinned() }} style={{ "--steps": STEPS }}>
      <figure id="agent-ask" class="pin">
        <div class="stage">
          {/* The session as it plays: decoration over the caption. */}
          <div class="session" aria-hidden="true">
            <p class="ask">{ASK}</p>
            <ol class="does">
              <For each={DOES}>
                {(line, i) => (
                  <li class={lineState(i(), step())}>
                    <span class="mark">
                      <Show
                        when={lineState(i(), step()) === "working"}
                        fallback={<DitherIcon name="Check" size={14} strokeWidth={1.75} />}
                      >
                        <DitherSpinner size={14} color="orange" />
                      </Show>
                    </span>
                    {line}
                  </li>
                )}
              </For>
            </ol>
          </div>

          {/* The screen the agent lays out, the hero of the shot. */}
          <div class="screen">
            {/* The render's result, a chip on the screen's corner: it comes
                with the line that renders, at work, then ready. */}
            <div class={`render ${render()}`} aria-hidden="true">
              <span class="mark">
                <Show when={render() !== "done"} fallback={<DitherIcon name="Check" size={14} strokeWidth={1.75} />}>
                  <DitherSpinner size={14} color="orange" />
                </Show>
              </span>
              <span class="render-words">
                <span data-on={render() !== "done" ? "" : undefined}>Rendering MP4</span>
                <span data-on={render() === "done" ? "" : undefined}>MP4 ready</span>
              </span>
            </div>
            <div class="screen-title">Deploys</div>
            <div class="screen-row">
              <div class="part" classList={{ on: step() >= PARTS.count }}>
                <span class="slot" />
                <div class="count">
                  <DitherNumberText value={DEPLOYS} class="count-n" />
                  <DitherText tone="muted" size="xs">
                    deploys this week
                  </DitherText>
                </div>
              </div>
              <div class="part" classList={{ on: step() >= PARTS.meter }}>
                <span class="slot" />
                <div class="meter">
                  <DitherText tone="muted" size="xs">
                    Build minutes, 64% used
                  </DitherText>
                  <DitherProgress value={64} color="blue" aria-label="Build minutes" />
                </div>
              </div>
            </div>
            <div class="part part-switch" classList={{ on: step() >= PARTS.toggle }}>
              <span class="slot" />
              <div class="switch">
                <DitherSwitch modelValue={auto()} onUpdateModelValue={setAuto} label="Auto deploy" />
                <span aria-hidden="true">Auto deploy</span>
              </div>
            </div>
            <div class="part part-chart" classList={{ on: step() >= PARTS.chart }}>
              <span class="slot" />
              <Sparkline data={[...DAYS]} color="blue" variant="dotted" sparkles={false} class="chart" />
            </div>
          </div>
        </div>

        <figcaption class="sr-only">
          The ask: {ASK} Your agent {TOLD.slice(0, -1).join(", ")} and {TOLD[TOLD.length - 1]}.
        </figcaption>
      </figure>
      <Show when={pinned()}>
        <div class="markers" aria-hidden="true">
          <For each={NOTCHES}>{(i) => <span ref={(el) => (markers[i] = el)} />}</For>
        </div>
      </Show>
    </div>
  )
}
