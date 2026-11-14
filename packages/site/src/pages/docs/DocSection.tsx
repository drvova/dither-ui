// One docs section, as every pack writes it: its element (a direct child of
// the docs' flow, which shows one at a time), its id, its shell and its
// heading all from its nav item (`DOCS` in `groups.ts`), so a section and
// the sidebar, the sitemap and its links can never name it apart.
import { type Accessor, createContext, createMemo, type JSX, Show, useContext } from "solid-js"
import { headingOf, sectionItem, type SectionId } from "@/pages/docs/groups"

/** The shell every section stands in: its room above, and where a jump to it
 * stops under the header. */
const SHELL = "mt-16 scroll-mt-24"

type DocSectionProps = {
  id: SectionId
  /** The hook of the section's own stylesheet (`<kebab-name>-scope`). */
  class?: string
  /** The heading's row, around the heading: a link or a figure beside it. */
  head?: (heading: JSX.Element) => JSX.Element
  /** Render the contents only once the section has been shown: for a pack
   * whose sections are heavy (charts, galleries, whole screens), so a page
   * never holds its siblings' demos hidden. */
  defer?: boolean
  children?: JSX.Element
}

export default function DocSection(props: DocSectionProps) {
  const item = sectionItem(props.id)
  const heading = <h2 class="text-lg tracking-tight">{headingOf(item)}</h2>
  const opened = props.defer ? useOpened(props.id) : null
  return (
    <section id={item.id} class={props.class ? `${props.class} ${SHELL}` : SHELL}>
      {props.head ? props.head(heading) : heading}
      {opened ? <Show when={opened()}>{props.children}</Show> : props.children}
    </section>
  )
}

/** The section the docs' page shows, which it provides to every pack. */
export const SHOWN_SECTION = createContext<Accessor<string>>(() => "")

/** Whether a section has been shown since its pack mounted: what a section
 * whose code is a chunk of its own waits for, so a pack mounted for another
 * of its sections never loads it. */
export function useOpened(id: SectionId): Accessor<boolean> {
  const shown = useContext(SHOWN_SECTION)
  return createMemo<boolean>((was) => was || shown() === id, false)
}
