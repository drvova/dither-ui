<script lang="ts">
  // The header, the Vue site's own: a capsule on the raised ground floating
  // over the page, centred, lifted by its shadow alone; the brand, the
  // site's links (GitHub under its mark) and the chrome "Open studio" key.
  // Under lg the links the capsule has no room for live in the menu
  // (`menu.ts`, the Vue header's table): its key, the sheet's bands in
  // miniature, opens them as a modal sheet of tone steps that arrives as the
  // kit's wipe and rolls back up when it is closed. Sticky is positioned,
  // and z-40 keeps it over main, which isolates the page art.
  import { pixelPrefersReducedMotion } from "@dither-kit/engine/pixel"
  import { wipeStyle } from "@dither-kit/engine/wipe"
  import { onMount, tick } from "svelte"
  import BrandMark from "./BrandMark.svelte"
  import { docsHref } from "./facts"
  import { GITHUB, STUDIO } from "./links"
  import {
    BAND_INK,
    CLOSE_CELLS,
    MENU_LINKS,
    MENU_WIDE,
        SHEET_HEAD_FOOT,
    SHEET_WIPE,
    STUDIO_FILL,
    STUDIO_LINK,
    bandFill,
    maskCss,
    seamStyle,
    type MenuLinkId,
    type MenuPhase,
  } from "./menu"
  import "./site-header.css"
  import ToolMark from "./ToolMark.svelte"

  const MENU_ID = "site-menu"

  /** Where each link goes on this site. */
  const HREF: Record<MenuLinkId, string> = {
    components: "#examples",
    docs: docsHref(),
    agents: "#ask",
    github: GITHUB,
  }
  const SHOWN = { md: "hidden md:inline-flex", lg: "hidden lg:inline-flex" } as const
  const external = (id: MenuLinkId) => id === "github"
  
  // The menu: a native modal dialog (focus held inside, Escape closes, the
  // page inert under it), the page holding still while it is open.
  let phase = $state<MenuPhase>("shut")
  let sheet = $state<HTMLDialogElement | null>(null)
  let key = $state<HTMLButtonElement | null>(null)
  let leaving = 0
  const lock = (on: boolean) => {
    document.documentElement.style.overflow = on ? "hidden" : ""
  }
  async function show() {
    clearTimeout(leaving)
    phase = "open"
    lock(true)
    await tick()
    if (!sheet?.open) sheet?.showModal?.()
  }
  /** Shut at once: a link taken (the page is moving on), the window grown. */
  function shut() {
    clearTimeout(leaving)
    if (phase === "shut") return
    phase = "shut"
    lock(false)
    if (sheet?.open) sheet.close()
    key?.focus()
  }
  /** Shut as it came: the wipe played back, the sheet rolling up from its foot. */
  function leave() {
    if (phase !== "open") return
    if (pixelPrefersReducedMotion()) return shut()
    phase = "leaving"
    leaving = window.setTimeout(shut, SHEET_WIPE.duration * 1000)
  }
  // Escape asks the dialog to cancel: it leaves the same way the close key does.
  function onCancel(e: Event) {
    e.preventDefault()
    leave()
  }

  /** The kit's wipe down the screen at its one pace, played back when the
   * sheet leaves (whole at once under reduced motion). */
  function wipe(node: HTMLElement, at: MenuPhase) {
    let raf = 0
    const play = (back: boolean) => {
      cancelAnimationFrame(raf)
      if (pixelPrefersReducedMotion()) return
      const start = performance.now()
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / 1000 / SHEET_WIPE.duration)
        node.style.cssText = maskCss(
          wipeStyle(back ? 1 - t : t, { ...SHEET_WIPE, width: node.clientWidth, height: node.clientHeight }),
        )
        if (t < 1) raf = requestAnimationFrame(frame)
      }
      frame(start)
    }
    play(at === "leaving")
    return {
      update: (next: MenuPhase) => play(next === "leaving"),
      destroy: () => cancelAnimationFrame(raf),
    }
  }

  // From lg the capsule holds every link: a menu left open by a rotation closes.
  onMount(() => {
    const wide = matchMedia(`(min-width: ${MENU_WIDE}px)`)
    const onWide = (e: MediaQueryListEvent) => e.matches && shut()
    wide.addEventListener("change", onWide)
    return () => {
      wide.removeEventListener("change", onWide)
      clearTimeout(leaving)
      if (phase !== "shut") lock(false)
    }
  })
</script>

<header class="site-head sticky top-0 z-40">
  <div class="site-capsule text-xs">
    <a href="#/" class="flex h-8 items-center gap-2.5 pl-2 whitespace-nowrap">
      <BrandMark size={13} />
      <span class="max-[359px]:sr-only">dither-ui</span>
    </a>
    <nav class="flex items-center text-muted-foreground" aria-label="Site">
      {#each MENU_LINKS as l (l.id)}
        <a
          href={HREF[l.id]}
          class="nav-a {SHOWN[l.from]}"
          target={external(l.id) ? "_blank" : undefined}
          rel={external(l.id) ? "noreferrer" : undefined}
          >{#if external(l.id)}<ToolMark id="github" size={13} />{/if}{l.label}{#if external(l.id)}<span
              class="sr-only"
            >
              (opens in a new tab)</span
            >{/if}</a
        >
      {/each}
    </nav>
    <div class="flex items-center gap-1">
      <a href={STUDIO} class="nav-a key-chrome studio-key hidden md:inline-flex">{STUDIO_LINK.label}</a>
      <button
        bind:this={key}
        type="button"
        class="nav-a menu-key lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={phase === "open"}
        aria-controls={MENU_ID}
        onclick={show}
      >
        <span class="menu-chip" aria-hidden="true">
          {#each BAND_INK as _, i (i)}
            <span style:background={bandFill(i)}></span>
          {/each}
          <span style:background={STUDIO_FILL}></span>
        </span>
        <span class="max-[359px]:sr-only">Menu</span>
      </button>
    </div>
  </div>
</header>

<dialog id={MENU_ID} bind:this={sheet} class="site-menu" aria-label="Site menu" oncancel={onCancel} onclose={shut}>
  {#if phase !== "shut"}
    <div class="menu-sheet" data-phase={phase} use:wipe={phase}>
      <!-- The head is the header itself, standing where it stood; "Menu"
           turned to "Close" in its place (the Vue header's SheetHead). -->
      <div class="site-head sheet-head" style:padding-bottom="{SHEET_HEAD_FOOT}px">
        <div class="site-capsule text-xs">
          <span class="flex h-8 items-center gap-2.5 pl-2 whitespace-nowrap">
            <BrandMark size={13} /><span class="max-[359px]:sr-only">dither-ui</span>
          </span>
          <!-- svelte-ignore a11y_autofocus (a modal's first stop: its close key) -->
          <button type="button" class="nav-a menu-key" aria-label="Close menu" autofocus onclick={leave}>
            <BrandMark cells={CLOSE_CELLS} size={14} />
            <span class="max-[359px]:sr-only" aria-hidden="true">Close</span>
          </button>
        </div>
      </div>
      <nav class="menu-bands" aria-label="Site">
        {#each MENU_LINKS as l, i (l.id)}
          <a
            href={HREF[l.id]}
            class="menu-band"
            style:background={bandFill(i)}
            target={external(l.id) ? "_blank" : undefined}
            rel={external(l.id) ? "noreferrer" : undefined}
            onclick={shut}
          >
            <span class="menu-seam" style={seamStyle(bandFill(i))} aria-hidden="true"></span>
            <span class="menu-name"
              >{#if external(l.id)}<ToolMark id="github" size={18} />{/if}{l.label}{#if external(l.id)}<span
                  class="sr-only"
                >
                  (opens in a new tab)</span
                >{/if}</span
            >
            <span class="menu-note">{l.note}</span>
          </a>
        {/each}
        <a href={STUDIO} class="menu-band" style:background={STUDIO_FILL} onclick={shut}>
          <span class="menu-seam" style={seamStyle(STUDIO_FILL)} aria-hidden="true"></span>
          <span class="menu-name">{STUDIO_LINK.label}</span>
          <span class="menu-note">{STUDIO_LINK.note}</span>
        </a>
      </nav>
    </div>
  {/if}
</dialog>
