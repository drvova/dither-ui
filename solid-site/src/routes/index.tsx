// The Solid kit's bench: every component ported so far, live, on the
// landing's ground. It stands here until the landing itself moves over.
import { Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { createSignal, For } from "solid-js"
import {
  type ButtonVariant,
  DitherAurora,
  DitherButton,
  DitherHeatTrail,
  DitherPoster,
  DitherScreen,
} from "@dither-kit"
import type { ScreenKind } from "@dither-kit/engine/pixel"
import { TRAIL } from "@/pages/landing/plate"

const VARIANTS: ButtonVariant[] = ["gradient", "dotted", "hatched", "solid"]
const SCREENS: ScreenKind[] = ["bayer", "line", "diagonal", "dot", "cross"]

export default function Bench() {
  const [screen, setScreen] = createSignal<ScreenKind>("bayer")
  const [presses, setPresses] = createSignal(0)
  return (
    <div class="relative isolate min-h-dvh bg-background font-mono text-foreground antialiased">
      <Title>The Solid kit so far</Title>
      <DitherHeatTrail pinned class="!fixed inset-0 -z-10" {...TRAIL} cell={4} />
      <main id="main" class="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <header class="flex flex-col gap-3">
          <h1 class="font-display text-3xl">The Solid kit so far</h1>
          <p class="max-w-prose text-sm text-muted-foreground">
            Each surface below is a Solid component printing through the same engine as the Vue kit. Move the pointer
            over the page, press a key, and change the screen.
          </p>
        </header>

        <section aria-labelledby="bench-poster" class="flex flex-col gap-4">
          <h2 id="bench-poster" class="text-sm">
            Poster, through a screen
          </h2>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Print screen">
            <For each={SCREENS}>
              {(kind) => (
                <button
                  type="button"
                  aria-pressed={screen() === kind}
                  onClick={() => setScreen(kind)}
                  class="min-h-10 rounded-md bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background"
                >
                  {kind}
                </button>
              )}
            </For>
          </div>
          <div class="h-80 overflow-hidden rounded-md">
            <DitherScreen screen={screen()}>
              <DitherPoster inks={["blue", "orange", "#e4e1d8"]} seed={7} cell={4} />
            </DitherScreen>
          </div>
        </section>

        <section aria-labelledby="bench-aurora" class="flex flex-col gap-4">
          <h2 id="bench-aurora" class="text-sm">
            Aurora
          </h2>
          <div class="h-56 overflow-hidden rounded-md">
            <DitherAurora colors={["#358ff3", "#ff9632", "#e4e1d8"]} frameRate={15} />
          </div>
        </section>

        <section aria-labelledby="bench-button" class="flex flex-col gap-4">
          <h2 id="bench-button" class="text-sm">
            Buttons
          </h2>
          <div class="flex flex-wrap items-center gap-3">
            <For each={VARIANTS}>
              {(variant) => (
                <DitherButton variant={variant} color="blue" onClick={() => setPresses((n) => n + 1)}>
                  {variant}
                </DitherButton>
              )}
            </For>
            <DitherButton seed={12} loading>
              Loading
            </DitherButton>
            <DitherButton color="orange" disabled>
              Disabled
            </DitherButton>
          </div>
          <p class="text-xs text-muted-foreground" aria-live="polite">
            Pressed {presses()} {presses() === 1 ? "time" : "times"}.
          </p>
        </section>

        <p class="text-xs text-muted-foreground">
          <A href="/404.html" class="underline underline-offset-4">
            See the page an unknown address lands on
          </A>
        </p>
      </main>
    </div>
  )
}
