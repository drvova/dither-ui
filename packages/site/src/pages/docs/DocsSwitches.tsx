// The switches that act on the whole docs page: what its code is written
// in, its interface sounds (Kobra's: taps, switches, copies) and its theme,
// revealed as a circle from the toggle. The reader's own, kept across
// visits. The browser chrome wears the page's ground in the theme picked:
// the head's `theme-color` (rendered with the page) is set to the ground as
// it turns. An island of the docs.
import { createEffect, For, onMount } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import { useTheme } from "@/shared/lib/useTheme"
import { restoreStyling, setStyling, STYLING_LABELS, styling, STYLINGS } from "@/shared/lib/restyle"
import { play, restoreSounds, setSounds, sounds } from "@/shared/lib/sound"

export default function DocsSwitches() {
  const { dark, ground, revealToggle } = useTheme()
  createEffect(() => {
    const tint = ground()
    if (tint) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tint)
  })
  onMount(() => {
    restoreSounds()
    restoreStyling()
  })
  function flipTheme(e: MouseEvent) {
    play("theme")
    revealToggle(e)
  }
  function flipSounds() {
    setSounds(!sounds())
    if (sounds()) play("on")
  }
  /* A toggle taps only when it changes something. */
  function choose(apply: () => void, already: boolean) {
    if (!already) play("tap")
    apply()
  }
  return (
    <div class="flex flex-wrap items-center gap-2 text-muted-foreground">
      <div class="track max-lg:hidden" role="group" aria-label="Styling">
        <For each={STYLINGS}>
          {(s) => (
            <button
              type="button"
              aria-pressed={styling() === s}
              class={`h-6 px-2.5 text-[11px] transition-colors ${styling() === s ? "ring-on" : "hover:text-foreground"}`}
              onClick={() => choose(() => setStyling(s), styling() === s)}
            >
              {STYLING_LABELS[s]}
            </button>
          )}
        </For>
      </div>
      <button
        type="button"
        class="flex size-8 items-center justify-center transition-colors hover:text-foreground"
        aria-label="Interface sounds"
        aria-pressed={sounds()}
        title={`Interface sounds: ${sounds() ? "on" : "off"}`}
        onClick={flipSounds}
      >
        <DitherIcon name={sounds() ? "Volume" : "VolumeOff"} size={15} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        class="flex size-8 items-center justify-center transition-colors hover:text-foreground"
        aria-label={dark() ? "Use light theme" : "Use dark theme"}
        onClick={flipTheme}
      >
        <DitherIcon name={dark() ? "Sun" : "Moon"} size={15} strokeWidth={1.5} />
      </button>
    </div>
  )
}
