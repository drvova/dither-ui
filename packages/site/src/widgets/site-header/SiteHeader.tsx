// The site's header, one for every page that reads (the landing, the docs):
// a capsule on the raised ground floating over the page, centred, lifted by
// its shadow alone; the brand, the site's links (GitHub under its mark), a
// page's own tools (`tools`: the docs' search and sections key) and the
// chrome "Open studio" key. Under lg the links the capsule has no room for
// live in the menu (`menu.ts`): its key, the sheet's bands in miniature,
// opens them as a bottom sheet of tone steps (`sheet.ts`) that slides up on
// the glide, slides back down when it is closed, and follows a finger that
// drags it down by its head, closing or springing back as it is let go.
// Sticky is positioned, and z-40 keeps it over a page's main, which
// isolates its art.
import { createSignal, For, type JSX, onCleanup, onMount, Show } from "solid-js"
import { coverPage } from "@dither-ui/kit/engine/cover.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { routePath } from "@/shared/lib/routes"
import { glide } from "@/shared/lib/glide-ref"
import { springTo } from "@/shared/lib/spring"
import {
  BAND_INK,
  CLOSE_CELLS,
  MENU_LINKS,
  MENU_WIDE,
  SHEET_HEAD_FOOT,
  STUDIO_FILL,
  STUDIO_LINK,
  bandFill,
  seamStyle,
  type MenuLinkId,
  type MenuPhase,
} from "@/widgets/site-header/menu"
import { SHEET_DRAG, SHEET_SLIDE, pullOf, releaseOf, velocityOf, type DragSample } from "@/widgets/site-header/sheet"
import "@/widgets/site-header/site-header.css"
import BrandMark from "../../shared/ui/BrandMark"
import Mascot from "../../shared/ui/Mascot"
import ToolMark from "../../shared/ui/ToolMark"

type SiteHeaderProps = {
  /** The page the reader is on, so its own link reads as current. */
  current: "landing" | "docs"
  /** A page's own tools, beside the studio key. */
  tools?: JSX.Element
}

const home = routePath("/")
const MENU_ID = "site-menu"

/** Where each link goes on this site. */
const HREF: Record<MenuLinkId, string> = {
  components: `${home}#examples`,
  docs: routePath("/docs"),
  agents: `${home}#ask`,
  github: "https://github.com/drvova/dither-ui",
}
const STUDIO = routePath("/studio")
const SHOWN = { md: "hidden md:inline-flex", lg: "hidden lg:inline-flex" } as const
const external = (id: MenuLinkId) => id === "github"

export default function SiteHeader(props: SiteHeaderProps) {
  const isCurrent = (id: MenuLinkId) => id === props.current

  // The menu: a native modal dialog (focus held inside, Escape closes, the page
  // inert under it), the page holding still while it is open. Its sheet
  // (`panel`) stands `offset` px below its rest while a hand or a spring
  // moves it.
  const [phase, setPhase] = createSignal<MenuPhase>("shut")
  let sheet: HTMLDialogElement | undefined
  let key: HTMLButtonElement | undefined
  let panel: HTMLDivElement | undefined
  let leaving = 0
  let slide: Animation | undefined
  let stopSpring = () => {}
  let offset = 0
  const lock = (on: boolean) => {
    document.documentElement.style.overflow = on ? "hidden" : ""
  }
  const place = (y: number) => {
    offset = y
    if (panel) panel.style.transform = y ? `translateY(${y}px)` : ""
  }
  /** Stop whatever moves the sheet, leaving it where it stands. */
  const still = () => {
    stopSpring()
    stopSpring = () => {}
    slide?.cancel()
    slide = undefined
  }
  function show() {
    clearTimeout(leaving)
    still()
    place(0)
    setPhase("open")
    lock(true)
    if (!sheet?.open) sheet?.showModal?.()
    // The sheet covers the page: the kit's loops under it hold their frame.
    coverPage(sheet ?? null)
    // It slides up from the foot of the screen on the glide.
    if (!pixelPrefersReducedMotion() && panel?.animate)
      slide = panel.animate([{ transform: "translateY(100%)" }, { transform: "none" }], SHEET_SLIDE)
  }
  /** Shut at once: a link taken (the page is moving on), the window grown. */
  function shut() {
    clearTimeout(leaving)
    still()
    place(0)
    if (phase() === "shut") return
    setPhase("shut")
    coverPage(null)
    lock(false)
    if (sheet?.open) sheet.close()
    key?.focus()
  }
  /** Shut as it came: the sheet slides back down from where it stands. */
  function leave() {
    if (phase() !== "open") return
    if (pixelPrefersReducedMotion()) return shut()
    setPhase("leaving")
    // The page wakes as the sheet slides off it.
    coverPage(null)
    still()
    if (panel?.animate)
      slide = panel.animate([{ transform: `translateY(${offset}px)` }, { transform: "translateY(100%)" }], {
        ...SHEET_SLIDE,
        fill: "forwards",
      })
    leaving = window.setTimeout(shut, SHEET_SLIDE.duration)
  }
  // Escape asks the dialog to cancel: it leaves the same way the close key does.
  function onCancel(e: Event) {
    e.preventDefault()
    leave()
  }
  // A tap on the page above the sheet (the dialog's own clear ground) closes it.
  function onDialogClick(e: MouseEvent) {
    if (e.target === sheet) leave()
  }

  // The sheet's head under a finger, a pen or a mouse: a drag once it has
  // moved past the slop (a tap on the close key stays a tap), the sheet
  // following it down, then let go to close or spring back.
  let grab: { id: number; y: number; dragging: boolean; samples: DragSample[] } | null = null
  function onGrabDown(e: PointerEvent) {
    if (phase() !== "open" || !e.isPrimary || e.button > 0) return
    grab = { id: e.pointerId, y: e.clientY, dragging: false, samples: [{ t: e.timeStamp, y: e.clientY }] }
  }
  function onGrabMove(e: PointerEvent) {
    if (!grab || e.pointerId !== grab.id) return
    const dy = e.clientY - grab.y
    if (!grab.dragging) {
      if (Math.abs(dy) < SHEET_DRAG.slop) return
      grab.dragging = true
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      still()
    }
    grab.samples.push({ t: e.timeStamp, y: e.clientY })
    if (grab.samples.length > 12) grab.samples.shift()
    place(pullOf(dy))
  }
  function onGrabUp(e: PointerEvent) {
    const was = grab
    grab = null
    if (!was?.dragging || e.pointerId !== was.id) return
    was.samples.push({ t: e.timeStamp, y: e.clientY })
    const velocity = velocityOf(was.samples)
    const height = panel?.offsetHeight ?? 0
    const close = releaseOf(offset, velocity, height) === "close"
    if (pixelPrefersReducedMotion()) return close ? shut() : place(0)
    if (!close) return void (stopSpring = springTo(offset, 0, velocity, place, () => {}))
    setPhase("leaving")
    coverPage(null)
    stopSpring = springTo(offset, height, velocity, place, shut)
  }
  // The browser took the touch (a scroll, a system gesture): back to rest.
  function onGrabCancel(e: PointerEvent) {
    const was = grab
    grab = null
    if (!was?.dragging || e.pointerId !== was.id) return
    if (pixelPrefersReducedMotion()) return place(0)
    stopSpring = springTo(offset, 0, 0, place, () => {})
  }

  // From lg the capsule holds every link: a menu left open by a rotation closes.
  onMount(() => {
    const wide = typeof matchMedia === "function" ? matchMedia(`(min-width: ${MENU_WIDE}px)`) : null
    const onWide = (e: MediaQueryListEvent) => e.matches && shut()
    wide?.addEventListener("change", onWide)
    onCleanup(() => {
      wide?.removeEventListener("change", onWide)
      clearTimeout(leaving)
      still()
      if (phase() !== "shut") {
        lock(false)
        coverPage(null)
      }
    })
  })

  return (
    <>
      <header class="site-head sticky top-0 z-40">
        <div class="site-capsule text-xs">
          <a href={home} class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2">
            <BrandMark size={13} />
            <span class="max-[359px]:sr-only">dither-ui</span>
            <Mascot size={16} alive class="max-[479px]:hidden" />
          </a>
          <nav ref={glide} class="flex items-center text-muted-foreground" aria-label="Site">
            <For each={MENU_LINKS}>
              {(l) => (
                <a
                  href={HREF[l.id]}
                  class="nav-a"
                  classList={{ [SHOWN[l.from]]: true, "text-foreground": isCurrent(l.id) }}
                  aria-current={isCurrent(l.id) ? "page" : undefined}
                  target={external(l.id) ? "_blank" : undefined}
                  rel={external(l.id) ? "noreferrer" : undefined}
                >
                  <Show when={external(l.id)}>
                    <ToolMark id="github" size={13} />
                  </Show>
                  {l.label}
                  <Show when={external(l.id)}>
                    <span class="sr-only"> (opens in a new tab)</span>
                  </Show>
                </a>
              )}
            </For>
          </nav>
          <div class="flex items-center gap-1">
            {props.tools}
            <a href={STUDIO} class="nav-a key-chrome studio-key hidden md:inline-flex">
              {STUDIO_LINK.label}
            </a>
            <button
              ref={(el) => (key = el)}
              type="button"
              class="nav-a menu-key lg:hidden"
              aria-haspopup="dialog"
              aria-expanded={phase() === "open"}
              aria-controls={MENU_ID}
              onClick={show}
            >
              <span class="menu-chip" aria-hidden="true">
                <For each={BAND_INK}>{(_, i) => <span style={{ background: bandFill(i()) }} />}</For>
                <span style={{ background: STUDIO_FILL }} />
              </span>
              <span class="max-[359px]:sr-only">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* The phase stands on the dialog. The sheet is the dialog's foot;
          above it the dialog is clear, the page held still under it. */}
      <dialog
        id={MENU_ID}
        ref={(el) => (sheet = el)}
        class="site-menu"
        aria-label="Site menu"
        data-phase={phase() === "shut" ? undefined : phase()}
        on:cancel={onCancel}
        on:close={shut}
        onClick={onDialogClick}
      >
        <Show when={phase() !== "shut"}>
          <div ref={(el) => (panel = el)} class="menu-sheet">
            {/* The head: the handle a finger drags the sheet down by, and
                the close key. Clear of the first band's seam. */}
            <div
              class="menu-grab"
              style={{ "padding-bottom": `${SHEET_HEAD_FOOT}px` }}
              onPointerDown={onGrabDown}
              onPointerMove={onGrabMove}
              onPointerUp={onGrabUp}
              onPointerCancel={onGrabCancel}
            >
              <span class="menu-handle" aria-hidden="true" />
              <span class="sheet-title">Menu</span>
              <button type="button" class="nav-a menu-key menu-close" aria-label="Close menu" autofocus onClick={leave}>
                <BrandMark cells={CLOSE_CELLS} size={14} />
                <span aria-hidden="true">Close</span>
              </button>
            </div>
            <nav class="menu-bands" aria-label="Site">
              <For each={MENU_LINKS}>
                {(l, i) => (
                  <a
                    href={HREF[l.id]}
                    class="menu-band"
                    style={{ background: bandFill(i()) }}
                    aria-current={isCurrent(l.id) ? "page" : undefined}
                    target={external(l.id) ? "_blank" : undefined}
                    rel={external(l.id) ? "noreferrer" : undefined}
                    onClick={shut}
                  >
                    <span class="menu-seam" style={seamStyle(bandFill(i()))} aria-hidden="true" />
                    <span class="menu-name">
                      <Show when={external(l.id)}>
                        <ToolMark id="github" size={18} />
                      </Show>
                      {l.label}
                      <Show when={external(l.id)}>
                        <span class="sr-only"> (opens in a new tab)</span>
                      </Show>
                    </span>
                    <span class="menu-note">{l.note}</span>
                  </a>
                )}
              </For>
              <a href={STUDIO} class="menu-band" style={{ background: STUDIO_FILL }} onClick={shut}>
                <span class="menu-seam" style={seamStyle(STUDIO_FILL)} aria-hidden="true" />
                <span class="menu-name">{STUDIO_LINK.label}</span>
                <span class="menu-note">{STUDIO_LINK.note}</span>
              </a>
            </nav>
          </div>
        </Show>
      </dialog>
    </>
  )
}
