// A film's chapter band: the line on the left, the spec list beside it (each
// row's figure first, in the foreground, its words muted). A new chapter
// comes in over the one before through the kit's ordered-dither dissolve.
// The band is a size container: its type scales with the reel's frame.
import { DitherReveal } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { createMemo, For, Index, Show } from "solid-js"
import type { ReelChapter } from "@/entities/widget"
import type { ChapterState } from "@/entities/widget"
import "./ReelBand.css"

type BandLayer = "previous" | "current"

/** The chapters on the band: the one before under the one coming in while
 * it dissolves, else the chapter alone. */
const layersOf = (s: ChapterState, reduced: boolean): BandLayer[] =>
  s.previous && s.progress < 1 && !reduced ? ["previous", "current"] : ["current"]

export default function ReelBand(props: { state: ChapterState; reduced: boolean; class?: string }) {
  const layers = createMemo(() => layersOf(props.state, props.reduced))
  const chapterOf = (key: BandLayer): ReelChapter =>
    key === "previous" ? (props.state.previous ?? props.state.chapter) : props.state.chapter
  const progressOf = (key: BandLayer) => (key === "current" && layers().length > 1 ? props.state.progress : 1)

  return (
    <div
      class={cn("reel-band-scope reel-band relative border-t border-border bg-background", props.class)}
      data-reel-chapter={props.state.chapter.line}
    >
      <For each={layers()}>
        {(key) => (
          <DitherReveal class="absolute inset-0 bg-background" progress={progressOf(key)} direction="none" cell={6}>
            <div class="band-grid h-full">
              <p class="band-line text-foreground">{chapterOf(key).line}</p>
              <ul class="band-spec">
                <Index each={chapterOf(key).spec}>
                  {(row) => (
                    <li>
                      <Show when={row()[0]}>
                        <span class="text-foreground">{row()[0]}</span>
                      </Show>
                      <span class="text-muted-foreground">{row()[1]}</span>
                    </li>
                  )}
                </Index>
              </ul>
            </div>
          </DitherReveal>
        )}
      </For>
    </div>
  )
}
