// The docs' flow: the front's title over the pack of sections the page
// shows (`pack-loaders.ts`), the section the page names provided to it
// (`SHOWN_SECTION`). Every section is a direct child of the flow, which
// shows only the page's own: the rule below holds the rest of a pack back
// in the bytes. Its demos, galleries and tables are live, so the flow is
// the docs page's island, woken with the page.
import { Show } from "solid-js"
import { GROUPS, type PackName } from "@/pages/docs/groups"
import { SHOWN_SECTION } from "./DocSection"
import { PACK_COMPONENTS } from "./pack-loaders"

/** The pack, the section the page shows, and whether the page is the
 * docs' front (the title shows, with the intro, over the first section). */
type DocsPackProps = { pack: PackName; shown: string; front: boolean }

export default function DocsPack(props: DocsPackProps) {
  const Pack = PACK_COMPONENTS[props.pack]
  return (
    <div class="docs-flow max-w-2xl">
      <style>{`.docs-flow > section:not([id="${props.shown}"]) { display: none }`}</style>
      {/* The title in chrome; on its baseline, the kit's spec as speed
          tags (beside the title, never an eyebrow over it). */}
      <div
        data-docs-front
        class={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${props.front ? "mt-6" : "sr-only"}`}
      >
        <h1 class="font-display text-[1.6rem] leading-tight font-normal">Documentation</h1>
        <ul class="flex flex-wrap gap-1 pb-1" aria-label="The kit">
          <li class="speed-tag">{GROUPS.flatMap((g) => g.items).length} sections</li>
          <li class="speed-tag">Solid</li>
          <li class="speed-tag">Tailwind or StyleX</li>
        </ul>
      </div>
      <Show when={props.front}>
        <p data-docs-front class="mt-3 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
          Every component draws on canvas through the same ordered-dither engine. Compose charts from parts, or drop in
          a single primitive.
        </p>
      </Show>
      <SHOWN_SECTION.Provider value={() => props.shown}>
        <Pack />
      </SHOWN_SECTION.Provider>
    </div>
  )
}
