import { createSignal, For, onCleanup, onMount } from "solid-js"
import { DitherIcon, ditherTransition, type WipeDirection } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"
import DocSection from "../DocSection"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"

/* Three scenes on one stage. Every change between them is a dithered view
   transition of the stage alone; the transport steps, plays and picks at
   random, and the direction and the ink are the transition's own options. */
const SCENES = [
  { title: "Cell by cell", line: "The old state breaks up in the Bayer order.", ground: "bg-card text-foreground" },
  {
    title: "Through the ink",
    line: "A band of colour rides the front between the two.",
    ground: "bg-foreground text-background",
  },
  {
    title: "Any change",
    line: "A route, a theme, a tab: one call wraps it.",
    ground: "bg-accent text-accent-foreground",
  },
] as const
const DIRECTIONS: [WipeDirection, string][] = [
  ["right", "Wipe"],
  ["down", "Drop"],
  ["iris", "Iris"],
  ["none", "Dissolve"],
]
const INK = "var(--swatch-orange)"
const PLAY_MS = 1800

const KEY = "grid size-7 place-items-center rounded border border-border/60 text-muted-foreground hover:bg-accent/40"
const CHIP = "rounded border px-2 py-1 text-[11px]"
const PICKED = "border-accent bg-accent text-accent-foreground"
const UNPICKED = "border-border/60 text-muted-foreground hover:bg-accent/40"

const SNIPPET = `import { ditherTransition, ditherViewTransition } from "@dither-kit"

// Any DOM change: a scene, a tab, a theme.
await ditherTransition(
  async () => {
    scene.value = next
    await nextTick()
  },
  { target: stage.value, direction: "iris", ink: "var(--swatch-orange)", duration: 700 },
)

// Between pages: opt both in with CSS, @view-transition { navigation: auto; }
// then hand the new page's transition over in a script in its head.
addEventListener("pagereveal", (e) => {
  if (e.viewTransition) ditherViewTransition(e.viewTransition, { direction: "right" })
})`

const API: PropRow[] = [
  { prop: "update", type: "() => void | Promise<void> (the change)", default: "" },
  { prop: "direction", type: "'none' | 'right' | 'left' | 'down' | 'up' | 'iris'", default: "'none' (dissolve)" },
  { prop: "origin", type: "{ x, y } (viewport px; the iris's centre)", default: "the box's centre" },
  { prop: "cell", type: "number (px)", default: "6" },
  { prop: "band", type: "number (cells)", default: "10" },
  { prop: "seed", type: "number (a seeded 4×4 matrix)", default: "none (Bayer 8×8)" },
  { prop: "ink", type: "string (a CSS colour between the two)", default: "none" },
  { prop: "duration", type: "number (ms)", default: "600" },
  { prop: "easing", type: "EasingInput", default: "'ease-in-out'" },
  { prop: "target", type: "HTMLElement (the element that changes)", default: "the whole page" },
]

export default function TransitionSection() {
  const [scene, setScene] = createSignal(0)
  const [direction, setDirection] = createSignal<WipeDirection>("right")
  const [ink, setInk] = createSignal(true)
  const [playing, setPlaying] = createSignal(false)
  let stage: HTMLDivElement | undefined
  let busy = false
  let timer = 0

  async function go(next: number) {
    if (!stage || busy) return
    busy = true
    try {
      await ditherTransition(
        // the scene is in the DOM as the signal is set: nothing to wait for
        () => {
          setScene((next + SCENES.length) % SCENES.length)
        },
        { target: stage, direction: direction(), ink: ink() ? INK : undefined, duration: 700 },
      )
    } finally {
      busy = false
    }
  }
  const step = (by: number) => go(scene() + by)
  const random = () => go(scene() + 1 + Math.floor(Math.random() * (SCENES.length - 1)))

  function stop() {
    setPlaying(false)
    clearInterval(timer)
  }
  function togglePlay() {
    if (playing()) return stop()
    setPlaying(true)
    timer = window.setInterval(() => step(1), PLAY_MS)
  }

  // Playing stops when the stage leaves the screen.
  onMount(() => {
    let io: IntersectionObserver | null = null
    onCleanup(() => {
      stop()
      io?.disconnect()
    })
    if (typeof IntersectionObserver === "undefined" || !stage) return
    io = new IntersectionObserver((entries) => latestEntry(entries)?.isIntersecting || stop())
    io.observe(stage)
  })

  return (
    <DocSection id="dither-transition">
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        One state turns into the next through the same masks. <code class="text-foreground/80">ditherTransition</code>{" "}
        runs any DOM change as a view transition and dithers its two snapshots, the old one breaking up as the new one
        resolves, with an <code class="text-foreground/80">ink</code> riding the front between them. Give it a{" "}
        <code class="text-foreground/80">target</code> to change one element while the page stays live, or none for the
        whole page: this site moves between its pages and turns its theme that way. Without the View Transitions API,
        under reduced motion or while the clock is directed, the change just happens.
      </p>
      <DemoCard code={SNIPPET}>
        <div class="flex w-full flex-col items-center gap-3">
          <div
            ref={(el) => (stage = el)}
            class={`grid h-40 w-full max-w-sm place-items-center rounded-lg px-6 text-center ${SCENES[scene()].ground}`}
            aria-live="polite"
          >
            <div>
              <p class="text-xl tracking-tight">{SCENES[scene()].title}</p>
              <p class="mt-1 text-[12px]">{SCENES[scene()].line}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button type="button" class={KEY} aria-label="Previous scene" onClick={() => step(-1)}>
              <DitherIcon name="ArrowLeft" size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              class={KEY}
              aria-label={playing() ? "Pause" : "Play"}
              aria-pressed={playing()}
              onClick={togglePlay}
            >
              <DitherIcon name={playing() ? "Pause" : "Play"} size={14} strokeWidth={1.5} />
            </button>
            <button type="button" class={KEY} aria-label="Next scene" onClick={() => step(1)}>
              <DitherIcon name="ArrowRight" size={14} strokeWidth={1.5} />
            </button>
            <button type="button" class={KEY} aria-label="Random scene" onClick={random}>
              <DitherIcon name="Dice" size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <For each={DIRECTIONS}>
              {([value, label]) => (
                <button
                  type="button"
                  class={`${CHIP} ${direction() === value ? PICKED : UNPICKED}`}
                  aria-pressed={direction() === value}
                  onClick={() => setDirection(value)}
                >
                  {label}
                </button>
              )}
            </For>
            <button
              type="button"
              class={`${CHIP} ${ink() ? PICKED : UNPICKED}`}
              aria-pressed={ink()}
              onClick={() => setInk((on) => !on)}
            >
              Ink
            </button>
          </div>
        </div>
      </DemoCard>
      <PropsTable rows={API} />
    </DocSection>
  )
}
