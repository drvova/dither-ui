import { createEffect, createSignal, For, on, Show } from "solid-js"
import { DitherIcon, type IconName } from "@dither-ui/kit"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { GROUPS } from "@/pages/docs/groups"
import { bandFill, seamStyle } from "@/widgets/site-header"
import { routePath } from "@/shared/lib"
import "./DocsNav.css"

/** A section's address: the deep link every nav link carries and the URL
 * a section's page lives at. */
export const docsUrl = (id: string) => routePath(`/docs/${id}`)

/** Where a docs list stands: the rail beside the content (a pointer's 25px
 * targets at a 27px pitch) or the sections sheet (a finger's, at the
 * menu's reading size). */
export type NavPlace = "rail" | "sheet"
export const NAV_LINK: Record<NavPlace, string> = { rail: "py-1 text-[11px]", sheet: "py-2 text-[15px]" }
/** A group's heading sticks to the top of its list while its sections
 * scroll under it (the landmark in a long list). The list's top room lives
 * here, not on the scroller, since a sticky heading sticks at the
 * scroller's content edge and its padding would show the list above it.
 * In the rail the heading lies on the page's ground, unseen; in the sheet
 * each group is a band of the menu's (a step of the ink toward the ground,
 * seamed into the one above through the Bayer matrix) and its heading
 * sticks on the band's own fill. */
export const NAV_PLACE: Record<NavPlace, { top: string; head: string }> = {
  rail: { top: "pt-10", head: "bg-background" },
  sheet: { top: "", head: "" },
}

/** A part of the section in view (its heading, a gallery heading, its API
 * table), read from its DOM: what "On this page" lists. */
export type PagePart = { label: string; el: HTMLElement }

export type DocsNavProps = {
  activeId: string
  variant: NavPlace
  parts?: PagePart[]
  onGo?: (id: string) => void
  onPart?: (el: HTMLElement) => void
}

const groupOf = (id: string) => GROUPS.find((g) => g.items.some((i) => i.id === id))?.title

// Each group under its glyph (the landing's family glyphs).
const GROUP_ICON: Record<string, IconName> = {
  Overview: "Home",
  Primitives: "Box",
  Typography: "Type",
  Handbook: "Book",
  Examples: "Layout",
  Components: "Grid",
  Backgrounds: "Image",
  Text: "Sparkles",
  Animations: "Pulse",
  Utils: "Palette",
}

/** The docs' section list, grouped under the families' glyphs: the sidebar
 * rail at lg, the sections sheet under it. Given the parts of the section
 * in view, the sheet lists them under its link (the first is the section's
 * own heading, which the link already is). */
export default function DocsNav(props: DocsNavProps) {
  const parts = () => props.parts ?? []

  // The rail keeps the section in view in its own view: when the current link
  // leaves the rail's middle band it scrolls the rail (never the page) to put
  // it in the middle, at once on the first (a deep link), smoothly after.
  let root: HTMLDivElement | undefined
  let placed = false
  /** The nearest ancestor that scrolls on its own: the rail's aside. */
  const scroller = (el: HTMLElement | undefined) => {
    for (let n = el?.parentElement; n; n = n.parentElement) {
      const y = getComputedStyle(n).overflowY
      if (y === "auto" || y === "scroll") return n
    }
    return null
  }
  createEffect(
    on(
      () => props.activeId,
      () => {
        if (props.variant !== "rail") return
        // once the link's group has opened (the effect below)
        queueMicrotask(() => {
          const rail = scroller(root)
          const link = root?.querySelector<HTMLElement>("a[aria-current]")
          if (!rail || !link) return
          const box = rail.getBoundingClientRect()
          const at = link.getBoundingClientRect()
          const margin = box.height * 0.2
          if (at.top >= box.top + margin && at.bottom <= box.bottom - margin) return
          const smooth = placed && !pixelPrefersReducedMotion()
          rail.scrollTo({
            top: rail.scrollTop + at.top - box.top - box.height / 2,
            behavior: smooth ? "smooth" : "auto",
          })
          placed = true
        })
      },
      { defer: true },
    ),
  )

  // Groups fold: the one holding the current section opens itself, the
  // reader opens or closes the rest; a folded group's links stay in the DOM
  // (hidden), so the list is whole for find-in-page and the crawler.
  // The group of the section the page opens on is read with the render, so
  // a server's page has it open.
  const first = groupOf(props.activeId)
  const [folds, setFolds] = createSignal(new Set<string>(first ? [first] : []))
  const opened = (title: string) => folds().has(title)
  createEffect(
    on(
      () => props.activeId,
      (id) => {
        const g = groupOf(id)
        if (g && !folds().has(g)) setFolds(new Set([...folds(), g]))
      },
      { defer: true },
    ),
  )
  function fold(title: string) {
    const next = new Set(folds())
    if (next.has(title)) next.delete(title)
    else next.add(title)
    setFolds(next)
  }
  /** A group's band in the sheet: its fill, one step per group down the list. */
  const band = (i: number) => (props.variant === "sheet" ? bandFill(i, GROUPS.length) : undefined)
  const listId = (title: string) => `docs-${props.variant}-${title.toLowerCase().replace(/\W+/g, "-")}`

  return (
    <div
      ref={(el) => (root = el)}
      class={`docs-nav grid gap-3 ${NAV_PLACE[props.variant].top}`}
      data-place={props.variant}
    >
      <For each={GROUPS}>
        {(grp, gi) => (
          <div class="nav-grp" style={band(gi()) ? { background: band(gi()) } : undefined}>
            <Show when={band(gi())}>
              {(fill) => <span class="menu-seam" style={seamStyle(fill())} aria-hidden="true" />}
            </Show>
            <button
              type="button"
              class={`nav-head sticky top-0 z-10 flex min-h-7 w-full items-center gap-2 py-1.5 text-left text-[11px] font-medium text-foreground ${NAV_PLACE[props.variant].head}`}
              style={band(gi()) ? { background: band(gi()) } : undefined}
              data-group={grp.title}
              aria-expanded={opened(grp.title)}
              aria-controls={listId(grp.title)}
              onClick={() => fold(grp.title)}
            >
              <span class="nav-name inline-flex items-center gap-2">
                <DitherIcon name={GROUP_ICON[grp.title] ?? "Grid"} size={13} strokeWidth={1.5} />
                {grp.title}
              </span>
              <span class="nav-count spec ml-auto tabular-nums">
                {grp.items.length}
                <span class="nav-unit">{grp.items.length === 1 ? " section" : " sections"}</span>
              </span>
              <DitherIcon
                name="ChevronRight"
                size={12}
                strokeWidth={1.75}
                class={`nav-chev text-muted-foreground transition-transform duration-150 motion-reduce:transition-none ${opened(grp.title) ? "rotate-90" : ""}`}
              />
            </button>
            <ul
              id={listId(grp.title)}
              class="mt-1 grid gap-0.5 border-l border-border/60"
              style={{ display: opened(grp.title) ? undefined : "none" }}
            >
              <For each={grp.items}>
                {(it) => (
                  <li>
                    <a
                      href={docsUrl(it.id)}
                      aria-current={props.activeId === it.id ? "true" : undefined}
                      class={`-ml-px block border-l pl-3 transition-colors ${NAV_LINK[props.variant]} ${
                        props.activeId === it.id
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        props.onGo?.(it.id)
                      }}
                    >
                      {it.label}
                    </a>
                    <Show when={props.activeId === it.id && parts().length > 1}>
                      <ul aria-label="On this page" class="grid gap-0.5">
                        <For each={parts().slice(1)}>
                          {(p) => (
                            <li>
                              <button
                                type="button"
                                class={`block w-full pl-6 text-left text-muted-foreground transition-colors hover:text-foreground ${NAV_LINK[props.variant]}`}
                                onClick={() => props.onPart?.(p.el)}
                              >
                                {p.label}
                              </button>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </div>
        )}
      </For>
    </div>
  )
}
