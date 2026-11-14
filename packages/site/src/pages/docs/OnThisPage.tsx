import { For } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import { NAV_LINK, type PagePart } from "./DocsNav"

export type OnThisPageProps = { parts: PagePart[]; onGo?: (el: HTMLElement) => void }

/** On this page (the rail right of the content at xl): the parts of the
 * section in view, each a button that scrolls to it, the first (the
 * section's heading) marked. Under lg the sections sheet lists them under
 * the section's link. */
export default function OnThisPage(props: OnThisPageProps) {
  return (
    <nav aria-label="On this page">
      <p class="flex items-center gap-2 text-[11px] font-medium text-foreground">
        <DitherIcon name="Menu" size={13} strokeWidth={1.5} />
        On this page
      </p>
      <ul class="mt-2.5 grid gap-0.5 border-l border-border/60">
        <For each={props.parts}>
          {(p, i) => (
            <li>
              <button
                type="button"
                class={`-ml-px block w-full border-l pl-3 text-left transition-colors hover:border-foreground/40 hover:text-foreground ${NAV_LINK.rail} ${
                  i() === 0 ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                }`}
                onClick={() => props.onGo?.(p.el)}
              >
                {p.label}
              </button>
            </li>
          )}
        </For>
      </ul>
    </nav>
  )
}
