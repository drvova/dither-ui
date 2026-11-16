// One docs section, as every pack writes it: its element (a direct child of
// the docs' flow, which shows one at a time), its id, its shell and its
// heading all from its nav item (`DOCS` in `groups.ts`), so a section and
// the sidebar, the sitemap and its links can never name it apart. Under its
// demos, the line that adds the kit components they use to a project.
import {
  type Accessor,
  createContext,
  createMemo,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  Show,
  useContext,
} from "solid-js"
import { headingOf, sectionItem, type SectionId } from "@/pages/docs/groups"
import { addCommand, kitNamesIn } from "@/shared/lib/add-command"
import { styling } from "@/shared/lib/restyle"
import { assetPath } from "@/shared/lib/routes"
import CodeBlock from "@/shared/ui/CodeBlock"

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
  const [codes, setCodes] = createSignal<Accessor<string>[]>([])
  const kit = {
    code(code: Accessor<string>) {
      setCodes((all) => [...all, code])
      onCleanup(() => setCodes((all) => all.filter((c) => c !== code)))
    },
  }
  return (
    <section id={item.id} class={props.class ? `${props.class} ${SHELL}` : SHELL}>
      {props.head ? props.head(heading) : heading}
      <SECTION_KIT.Provider value={kit}>
        {opened ? <Show when={opened()}>{props.children}</Show> : props.children}
      </SECTION_KIT.Provider>
      <AddLine names={() => [...new Set(codes().flatMap((c) => kitNamesIn(c())))]} />
    </section>
  )
}

/** What a section's demos hand it: the code each shows, whose kit
 * components its add line names. */
export const SECTION_KIT = createContext<{ code(code: Accessor<string>): void }>()

/** The line that adds a section's kit components to a project, from the
 * site the page is served by, in the reader's styling system. Made after
 * the demos (a server render is one pass), so it names every component
 * they use. */
function AddLine(props: { names: () => string[] }) {
  const [site, setSite] = createSignal<string>()
  onMount(() => setSite(new URL(assetPath(""), location.origin).href))
  return (
    <Show when={props.names().length}>
      <div class="mt-8" data-add-line>
        <div class="text-[13px] text-foreground">Add it to your project</div>
        <div class="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          One line copies {props.names().join(", ")} and every kit file they need into your project, in the styling
          system picked in the header.
        </div>
        <CodeBlock class="mt-3" code={addCommand(props.names(), { styling: styling(), site: site() })} />
      </div>
    </Show>
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
