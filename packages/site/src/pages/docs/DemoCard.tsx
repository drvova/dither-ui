import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  lazy,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
  useContext,
} from "solid-js"
import { routePath } from "@/shared/lib"
import { restoreStyling, setStyling, STYLING_LABELS, styling, STYLINGS } from "@/shared/lib/restyle"
import { play } from "@/shared/lib/sound"
import type { RunResult, SourceContext } from "@/widgets/source"
import { INSTALL } from "@/pages/docs/install"
import { docsFiles } from "./snippet"
import "./DemoCard.css"

/** How a demo sits in its well: inset on the well's padding, or bled to its
 * top and sides (a surface demo: its first frame takes the well's top
 * corners and drops its own border, the controls under it). A family sets
 * its default with `<DEMO_FIT.Provider value="bleed">`; a card's `fit` wins. */
export type DemoFit = "bleed" | "inset"
export const DEMO_FIT = createContext<DemoFit>("inset")

// The workbench and the source panel load on first use: the page's ~300
// cards share their chunks, which only a reader who inspects or opens the
// code pays for.
const Workbench = lazy(() => import("@/widgets/workbench").then((m) => ({ default: m.Workbench })))
const SourcePanel = lazy(() => import("@/widgets/source").then((m) => ({ default: m.SourcePanel })))
const RunView = lazy(() => import("@/widgets/source").then((m) => ({ default: m.RunView })))

export type DemoCardProps = { code: string; fit?: DemoFit; children?: JSX.Element }

// Chips are machined segments in a track; the picked one wears the site's
// pressed state.
const chipClass = (active: boolean) =>
  active ? "min-h-6 px-2.5 py-0.5 ring-on" : "min-h-6 px-2.5 py-0.5 text-muted-foreground hover:text-foreground"

function chip(apply: () => void, already: boolean) {
  if (!already) play("tap")
  apply()
}

export default function DemoCard(props: DemoCardProps) {
  const familyFit = useContext(DEMO_FIT)
  const fit = createMemo(() => props.fit ?? familyFit)
  const [tab, setTab] = createSignal<"preview" | "code">("preview")
  let root: HTMLDivElement | undefined
  let host: HTMLDivElement | undefined
  let content: HTMLDivElement | undefined
  let toggle: HTMLButtonElement | undefined

  // Mount the heavy slot (canvases, charts, whole demo trees) only as the card
  // approaches the viewport — and latch: once revealed it stays, so interaction
  // state inside a demo never resets on scroll. Falls back to always-on without
  // IntersectionObserver (jsdom included), so tests and ancient engines mount
  // at once. The preview frame keeps min-h-[280px], so the box exists
  // from first paint and below-fold growth never shifts visible content.
  const [revealed, setRevealed] = createSignal(false)

  onMount(() => {
    // the reader's own styling system, read once in a browser
    restoreStyling()
    if (typeof IntersectionObserver === "undefined" || !host) {
      setRevealed(true)
      return
    }
    let io: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          io?.disconnect()
          io = null
        }
      },
      { rootMargin: "600px" },
    )
    io.observe(host)
    onCleanup(() => io?.disconnect())
  })

  // Where this card sits — its section, its place among the section's cards,
  // the section's title and line — names its saved workspace, its files and
  // the brief an agent receives.
  const [where, setWhere] = createSignal<SourceContext>({
    section: "",
    n: 1,
    title: "",
    description: "",
    url: "",
    install: INSTALL,
  })

  function locate() {
    if (!root) return
    const section = root.closest("section[id]")
    const id = section?.id ?? "docs"
    const cards = section ? [...section.querySelectorAll("[data-demo-card]")] : [root]
    const n = cards.indexOf(root) + 1
    const name = section?.querySelector("h2")?.textContent?.trim() || id
    const line = [...(section?.querySelectorAll("p") ?? [])].find((p) => !p.closest("[data-demo-card]"))
    setWhere({
      section: id,
      n,
      title: `${name}${cards.length > 1 ? `, preview ${n}` : ""}`,
      description: line?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      url: `${location.origin}${routePath(`/docs/${id}`)}`,
      install: INSTALL,
    })
  }

  function show(next: "preview" | "code") {
    if (next === tab()) return
    play("tap")
    setTab(next)
  }

  // The workbench (Inspect): Kobra's component inspector and its tray of
  // tools over this preview — see widgets/workbench.
  const [inspecting, setInspecting] = createSignal(false)

  function inspect(on: boolean) {
    if (on) locate()
    play(on ? "on" : "off")
    setInspecting(on)
  }

  function exit() {
    play("off")
    setInspecting(false)
    queueMicrotask(() => toggle?.focus())
  }

  // The source (Code): the example and the kit files behind it as tabs —
  // see widgets/source. The panel mounts on first open and then stays, so
  // edits survive a trip to the Preview tab.
  const [opened, setOpened] = createSignal(false)
  createEffect(
    on(
      tab,
      (t) => {
        if (t !== "code") return
        setInspecting(false)
        if (!opened()) locate()
        setOpened(true)
      },
      { defer: true },
    ),
  )

  // A run replaces the demo with the compiled files until it is restored; the
  // frame then shows in both tabs, above the source like Kobra's.
  const [ran, setRan] = createSignal<RunResult | null>(null)
  let sheet: HTMLStyleElement | null = null

  function onRun(result: RunResult) {
    sheet?.remove()
    sheet = null
    if (result.css) {
      sheet = document.createElement("style")
      sheet.dataset.run = where().section
      sheet.textContent = result.css
      document.head.append(sheet)
    }
    setRan(result)
  }

  function restore() {
    play("tap")
    sheet?.remove()
    sheet = null
    setRan(null)
  }

  onCleanup(() => sheet?.remove())

  const renderRun = () => <RunView component={ran()!.component} />
  const runAttrs = createMemo(() => (ran() ? { [ran()!.attribute]: "" } : {}))

  return (
    <div ref={(el) => (root = el)} class="demo-card-scope mt-6" data-demo-card>
      {/* The tabs, and their chips beside them; on a phone the Code tab's
          chips drop under the tabs instead of running off the card. */}
      <div class="flex flex-wrap items-center justify-between gap-x-3 text-[12px]">
        <div class="track mb-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab() === "preview"}
            class={`h-7 px-3.5 transition-colors ${tab() === "preview" ? "ring-on" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => show("preview")}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab() === "code"}
            class={`h-7 px-3.5 transition-colors ${tab() === "code" ? "ring-on" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => show("code")}
          >
            Code
          </button>
        </div>
        <Show
          when={tab() === "code"}
          fallback={
            <div class="track mb-2 text-[11px]">
              <button
                ref={(el) => (toggle = el)}
                type="button"
                aria-pressed={inspecting()}
                class={`flex items-center gap-1.5 ${chipClass(inspecting())}`}
                title="The workbench: inspect, measure, annotate, capture"
                onClick={() => inspect(!inspecting())}
              >
                <svg viewBox="0 0 12 12" class="size-3" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8M6 4v4M4 6h4" />
                </svg>
                Inspect
              </button>
            </div>
          }
        >
          <div class="flex flex-wrap justify-end gap-x-3 gap-y-1 pb-2 text-[11px]">
            {/* The same snippet in the reader's styling system: Tailwind as
                authored, or a stylesheet, CSS Modules or StyleX. */}
            <div class="track" role="group" aria-label="Styling">
              <For each={STYLINGS}>
                {(s) => (
                  <button
                    aria-pressed={styling() === s}
                    class={chipClass(styling() === s)}
                    onClick={() => chip(() => setStyling(s), styling() === s)}
                  >
                    {STYLING_LABELS[s]}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
      <Show when={ran()}>
        <div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span class="micro">Running your files</span>
          <button type="button" class="nav-pill flex min-h-6 items-center px-3 text-foreground" onClick={restore}>
            Restore the demo
          </button>
        </div>
      </Show>
      <div
        ref={(el) => (host = el)}
        {...runAttrs()}
        class={`demo-well rim relative mt-3 flex min-h-[280px] items-center justify-center border ${fit() === "bleed" ? "bleed pb-6" : "p-4 sm:p-10"} ${inspecting() ? "data-[tray=bottom]:pb-16 data-[tray=top]:pt-16" : ""}`}
        style={{ display: tab() === "preview" || ran() ? undefined : "none" }}
        tabindex={inspecting() ? 0 : undefined}
        role={inspecting() ? "group" : undefined}
        aria-label={inspecting() ? "Preview, with the workbench" : undefined}
      >
        <div ref={(el) => (content = el)} class="w-full">
          <Switch
            fallback={
              // Quiet frame while the demo waits for its turn: a fast flick can
              // outrun the observer, and an empty bordered box reads as broken.
              <div
                class="flex h-40 animate-pulse items-center justify-center rounded-md bg-card/40 motion-reduce:animate-none"
                aria-hidden="true"
              >
                <span class="text-[11px] text-muted-foreground">preview</span>
              </div>
            }
          >
            {/* keyed: each run is a new result, so each mounts afresh */}
            <Match when={ran()} keyed>
              {(result) => <RunView component={result.component} />}
            </Match>
            <Match when={revealed()}>{props.children}</Match>
          </Switch>
        </div>
      </div>
      <Show when={inspecting() && tab() === "preview" && host && content && root}>
        <Workbench
          host={host!}
          content={content!}
          card={root!}
          benchKey={`${where().section}:${where().n}`}
          section={where().section}
          title={`${where().title} (dither-ui docs)`}
          url={where().url}
          render={ran() ? renderRun : () => props.children}
          onExit={exit}
        />
      </Show>
      {/* The source mounts when its tab is first opened (mounted with the page,
          every one of its ~150 hidden code blocks rendered at initial mount)
          and stays, so edits survive the Preview tab. */}
      <Show when={opened()}>
        <div class="mt-3" style={{ display: tab() === "code" ? undefined : "none" }}>
          <SourcePanel code={props.code} translate={docsFiles} styling={styling()} context={where()} onRun={onRun} />
        </div>
      </Show>
    </div>
  )
}
