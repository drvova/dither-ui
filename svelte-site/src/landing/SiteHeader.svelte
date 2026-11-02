<script lang="ts">
  // The header, the Vue site's own: a capsule on the raised ground floating
  // over the page, centred, lifted by its shadow alone; the brand, the
  // site's links (GitHub under its mark) and the chrome "Open studio" key.
  // Under lg the links the capsule has no room for live in the menu
  // (`menu.ts`, the Vue header's table): its key, the sheet's bands in
  // miniature, opens them as a modal sheet of tone steps that arrives as the
  // kit's wipe. Sticky is positioned, and z-40 keeps it over main, which
  // isolates the page art.
  import { pixelPrefersReducedMotion } from "@dither-kit/engine/pixel"
  import { wipeStyle } from "@dither-kit/engine/wipe"
  import { onMount, tick } from "svelte"
  import BrandMark from "./BrandMark.svelte"
  import { docsHref } from "./facts"
  import { GITHUB, STUDIO } from "./links"
  import {
    BAND_INK,
    MENU_WIDE,
    SEAM_HEIGHT,
    SEAM_MASK,
    SHEET_WIPE,
    STUDIO_FILL,
    bandFill,
    maskCss,
  } from "./menu"
  import "./site-header.css"
  import ToolMark from "./ToolMark.svelte"

  const MENU_ID = "site-menu"

  /** The site's links, in order: the capsule shows each from its width up,
   * the menu all of them. */
  const LINKS: readonly { label: string; href: string; from: "md" | "lg"; external?: boolean }[] = [
    { label: "Components", href: "#examples", from: "md" },
    { label: "Docs", href: docsHref(), from: "md" },
    { label: "Agents", href: "#ask", from: "md" },
    { label: "GitHub", href: GITHUB, from: "lg", external: true },
  ]
  const SHOWN = { md: "hidden md:inline-flex", lg: "hidden lg:inline-flex" } as const
  const seam = `${maskCss(SEAM_MASK)};height:${SEAM_HEIGHT}px;top:-${SEAM_HEIGHT}px`

  // The menu: a native modal dialog (focus held inside, Escape closes, the
  // page inert under it), the page holding still while it is open.
  let open = $state(false)
  let sheet = $state<HTMLDialogElement | null>(null)
  let key = $state<HTMLButtonElement | null>(null)
  const lock = (on: boolean) => {
    document.documentElement.style.overflow = on ? "hidden" : ""
  }
  async function show() {
    open = true
    lock(true)
    await tick()
    sheet?.showModal?.()
  }
  function hide() {
    if (!open) return
    open = false
    lock(false)
    if (sheet?.open) sheet.close()
    key?.focus()
  }

  /** The sheet's arrival: the kit's wipe down the screen at its one pace
   * (whole at once under reduced motion). */
  function wipeIn(node: HTMLElement) {
    if (pixelPrefersReducedMotion()) return
    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / 1000 / SHEET_WIPE.duration)
      node.style.cssText = maskCss(
        wipeStyle(p, { ...SHEET_WIPE, width: node.clientWidth, height: node.clientHeight }),
      )
      if (p < 1) raf = requestAnimationFrame(frame)
    }
    frame(start)
    return { destroy: () => cancelAnimationFrame(raf) }
  }

  // From lg the capsule holds every link: a menu left open by a rotation closes.
  onMount(() => {
    const wide = matchMedia(`(min-width: ${MENU_WIDE}px)`)
    const onWide = (e: MediaQueryListEvent) => e.matches && hide()
    wide.addEventListener("change", onWide)
    return () => {
      wide.removeEventListener("change", onWide)
      if (open) lock(false)
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
      {#each LINKS as l (l.label)}
        <a
          href={l.href}
          class="nav-a {SHOWN[l.from]}"
          target={l.external ? "_blank" : undefined}
          rel={l.external ? "noreferrer" : undefined}
          >{#if l.external}<ToolMark id="github" size={13} />{/if}{l.label}{#if l.external}<span class="sr-only">
              (opens in a new tab)</span
            >{/if}</a
        >
      {/each}
    </nav>
    <div class="flex items-center gap-1">
      <a href={STUDIO} class="nav-a key-chrome studio-key hidden md:inline-flex">Open studio</a>
      <button
        bind:this={key}
        type="button"
        class="nav-a menu-key lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
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

<dialog id={MENU_ID} bind:this={sheet} class="site-menu" aria-label="Site menu" onclose={hide}>
  {#if open}
    <div class="menu-sheet" use:wipeIn>
      <div class="menu-top">
        <span class="flex items-center gap-2.5 text-xs"><BrandMark size={13} />dither-ui</span>
        <!-- svelte-ignore a11y_autofocus (a modal's first stop: its close key) -->
        <button type="button" class="menu-close" aria-label="Close menu" autofocus onclick={hide}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </button>
      </div>
      <nav class="menu-bands" aria-label="Site">
        {#each LINKS as l, i (l.label)}
          <a
            href={l.href}
            class="menu-band"
            style:background={bandFill(i)}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noreferrer" : undefined}
            onclick={hide}
          >
            <span class="menu-seam" style="{seam};background:{bandFill(i)}" aria-hidden="true"></span>
            {#if l.external}<ToolMark id="github" size={18} />{/if}{l.label}{#if l.external}<span class="sr-only">
                (opens in a new tab)</span
              >{/if}
          </a>
        {/each}
        <a href={STUDIO} class="menu-band" style:background={STUDIO_FILL} onclick={hide}>
          <span class="menu-seam" style="{seam};background:{STUDIO_FILL}" aria-hidden="true"></span>
          Open studio
        </a>
      </nav>
    </div>
  {/if}
</dialog>
