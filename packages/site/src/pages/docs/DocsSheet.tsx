import { createEffect, createSignal, on, onCleanup, onMount, Show } from "solid-js"
import { DitherFocusScope, DitherReveal } from "@dither-ui/kit"
import { coverPage } from "@dither-ui/kit/engine/cover.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { GROUPS } from "@/pages/docs/groups"
import { SEAM_HEIGHT, SHEET_WIPE, SheetHead } from "@/widgets/site-header"
import DocsNav, { type PagePart } from "./DocsNav"

/** The sheet's id: the header key's `aria-controls` names it. */
export const SHEET_ID = "docs-sheet"

type DocsSheetProps = {
  open: boolean
  activeId: string
  parts: PagePart[]
  onClose?: () => void
  onGo?: (id: string) => void
  onPart?: (el: HTMLElement) => void
}

const total = GROUPS.reduce((n, g) => n + g.items.length, 0)

/** The sections sheet: under lg, the header's sections key opens every
 * section (the parts of the one in view under its link) from anywhere on
 * the page, opened on that section. It is the site menu's kind of sheet:
 * the header standing where it stood with "Close" in the key's place, the
 * families as bands of the ink's steps under it, arriving as the kit's
 * wipe down the screen and rolling back up when it shuts. A modal: focus
 * moves in and is trapped, Escape and the close key shut it, focus returns
 * to the key; the page under it holds still. */
export default function DocsSheet(props: DocsSheetProps) {
  let list: HTMLDivElement | undefined

  // The sheet stays up while it leaves: the wipe plays back over its own
  // length (at once under reduced motion), then it goes.
  const [shown, setShown] = createSignal(props.open)
  const [leaving, setLeaving] = createSignal(false)
  let gone = 0
  createEffect(
    on(
      () => props.open,
      (open) => {
        clearTimeout(gone)
        if (open) {
          setShown(true)
          setLeaving(false)
        } else if (shown() && !pixelPrefersReducedMotion()) {
          setLeaving(true)
          gone = window.setTimeout(() => {
            setShown(false)
            setLeaving(false)
          }, SHEET_WIPE.duration * 1000)
        } else setShown(false)
      },
      { defer: true },
    ),
  )

  // The page under the sheet holds still while it is open, and the kit's
  // loops on it hold their frame (the sheet covers them); both let go as the
  // sheet starts to leave.
  const lock = (on: boolean) => {
    document.documentElement.style.overflow = on ? "hidden" : ""
  }
  createEffect(
    on(
      () => props.open,
      (open) => {
        lock(open)
        if (!open) {
          coverPage(null)
          return
        }
        // Open on the section in view, not at the top of 300 links: once
        // the sheet has rendered.
        queueMicrotask(() => {
          if (!props.open) return
          coverPage(document.getElementById(SHEET_ID))
          const current = list?.querySelector<HTMLElement>("[aria-current]")
          if (list && current) {
            const box = list.getBoundingClientRect()
            list.scrollTop += current.getBoundingClientRect().top - box.top - box.height / 2
          }
        })
      },
    ),
  )

  // At lg the sidebar holds the list: a sheet left open by a rotation closes.
  onMount(() => {
    const wide = typeof matchMedia === "function" ? matchMedia("(min-width: 1024px)") : null
    const onWide = (e: MediaQueryListEvent) => e.matches && props.open && props.onClose?.()
    wide?.addEventListener("change", onWide)
    onCleanup(() => {
      clearTimeout(gone)
      coverPage(null)
      wide?.removeEventListener("change", onWide)
      lock(false)
    })
  })

  return (
    <Show when={shown()}>
      <DitherFocusScope
        id={SHEET_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Docs sections"
        class="fixed inset-0 z-50 font-mono text-foreground lg:hidden"
        onKeyDown={(e) => {
          if (e.key !== "Escape") return
          e.stopPropagation()
          props.onClose?.()
        }}
      >
        <DitherReveal {...SHEET_WIPE} reverse={leaving()} restartKey={leaving()} class="flex h-full flex-col">
          <SheetHead closeLabel="Close sections" onClose={() => props.onClose?.()}>
            <span class="sheet-title">
              Sections <span class="tabular-nums">{total}</span>
            </span>
          </SheetHead>
          {/* The list starts the seam's height up, in the head's foot room, so
              the first family's seam climbs into the ground as the menu's does. */}
          <div
            ref={(el) => (list = el)}
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            style={{ "margin-top": `-${SEAM_HEIGHT}px`, "padding-top": `${SEAM_HEIGHT}px` }}
          >
            <DocsNav
              activeId={props.activeId}
              variant="sheet"
              parts={props.parts}
              onGo={(id) => props.onGo?.(id)}
              onPart={(el) => props.onPart?.(el)}
            />
          </div>
        </DitherReveal>
      </DitherFocusScope>
    </Show>
  )
}
