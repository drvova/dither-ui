// The rail right of the content (xl and up): "On this page", the parts of
// the section the page shows (read from its bytes: its heading, each
// gallery heading, its props table), each a key that scrolls to it, and
// the section's Share. An island of the docs.
import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { goTo, partsOf, type PagePart } from "./DocsNav"
import OnThisPage from "./OnThisPage"
import SectionShare from "./SectionShare"

/** The section the page shows, and whether it is one (the docs' front
 * shares nothing of its own). */
type DocsAsideProps = { shown: string; share: boolean }

export default function DocsAside(props: DocsAsideProps) {
  const [parts, setParts] = createSignal<PagePart[]>([])
  onMount(() => {
    // The bytes hold the section; a page rendered anew in the browser brings
    // it with its pack, a chunk of its own, after this.
    const read = () => setParts(partsOf(props.shown)).length > 0
    if (read() || typeof MutationObserver === "undefined") return
    const arrivals = new MutationObserver(() => read() && arrivals.disconnect())
    arrivals.observe(document.body, { childList: true, subtree: true })
    onCleanup(() => arrivals.disconnect())
  })
  return (
    <div>
      <Show when={parts().length}>
        <OnThisPage parts={parts()} onGo={goTo} />
      </Show>
      <Show when={props.share}>
        <SectionShare id={props.shown} />
      </Show>
    </div>
  )
}
