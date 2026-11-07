<script lang="ts">
  // The landing, printed in the dark, always: one bone ink on obsidian, the
  // kit's art the only colour on it. The hero (the statement beside a print
  // the kit makes), then sections under a title with a lead beside it: a
  // bento of live kit components, the screen an agent's ask makes, what's
  // inside (the kit, the Studio, the bridge; the docs' families) and the
  // install, with a plate of the brand small in a wide field between them,
  // and a footer of the brand and link columns over the line-screen
  // wordmark. Michroma for display, mono for the rest; everything that
  // moves is the kit.
  import RiseWords from "./RiseWords.svelte"
  import { rise } from "./rise"
  import { Circuit, DitherAvatar, DitherGradient, DitherScreen, HeatTrail, type ScreenKind } from "@dither-kit-svelte"
  import "../fonts/display.css"
  import { copier } from "../copy.svelte"
  import "./landing.css"
  import AgentStory from "./AgentStory.svelte"
  import BrandGather from "./BrandGather.svelte"
  import { STAGINGS } from "./brand"
  import Examples from "./Examples.svelte"
  import { DOCS_FAMILIES, RUNTIME_DEPS, SECTION_COUNT, SPECS, VERSION, docsHref } from "./facts"
  import Hero from "./Hero.svelte"
  import InstallBlock from "./InstallBlock.svelte"
  import LineWordmark from "./LineWordmark.svelte"
  import { GITHUB, SITE, STUDIO } from "./links"
  import Plate from "./Plate.svelte"
  import { createDrive, drive } from "./drive"
  import { onMount } from "svelte"
  import HeatPrint from "./HeatPrint.svelte"
  import { CLOSE } from "./heat"
  import PixelWord from "./PixelWord.svelte"
  import { PLATES, STOCK, TRAIL } from "./plate"
  import SiteHeader from "./SiteHeader.svelte"
  import ToolMark from "./ToolMark.svelte"
  import WorksWith from "./WorksWith.svelte"

  const SKILL = `${SITE}/agent/SKILL.md`

  // The close's heat drifts as its band arrives, then only under the hand.
  let heatMoving = $state(false)
  const heat = createDrive((m) => (heatMoving = m))
  let closeBand = $state<HTMLElement | null>(null)
  onMount(() => {
    if (typeof IntersectionObserver === "undefined" || !closeBand) return heat.dispose
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        heat.run(CLOSE.drift)
        seen.disconnect()
      },
      { threshold: 0.25 },
    )
    seen.observe(closeBand)
    return () => {
      seen.disconnect()
      heat.dispose()
    }
  })

  // What "Copy agent prompt" puts on the clipboard: the install to run.
  const PROMPT = [
    "Add the dither-ui Svelte kit to this project:",
    "copy it with `npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte`,",
    `install ${RUNTIME_DEPS.join(", ")}, alias @dither-kit-svelte to src/dither-kit-svelte/index.ts,`,
    "then build what I ask from its components.",
  ].join(" ")
  const prompt = copier()

  // What's inside: the kit, the Studio and the bridge, each a card headed by
  // a strip the kit prints in its own ink through its own printer's screen
  // (blue in Bayer cells, the ember in lines, bone in a halftone dot): a
  // tone for the kit and the Studio, a circuit board for the bridge, its
  // signals running in the ember; its own character (the kit's seeded avatar of its title, in its
  // ink) standing on the strip's foot, its name in the pixel face, two lines
  // and its link.
  const INSIDE: {
    title: string
    name: string
    ink: string
    screen: ScreenKind
    /** What the strip prints: a tone from the ink, or a board in it. */
    art: "tone" | "circuit"
    text: string
    link: { label: string; href: string }
  }[] = [
    {
      title: "The kit",
      name: "kit",
      ink: "blue",
      screen: "bayer",
      art: "tone",
      text: "Plain source you own, one engine of rasters under every component, in Svelte 5 runes. Change anything, it's yours.",
      link: { label: "Read the quick start", href: docsHref("getting-started") },
    },
    {
      title: "The Studio",
      name: "studio",
      ink: "orange",
      screen: "line",
      art: "tone",
      text: "An infinite canvas to play with screens of kit parts. Export a frame as Vue, a PNG or an MP4, then go again.",
      link: { label: "Open the studio", href: STUDIO },
    },
    {
      title: "The agent bridge",
      name: "bridge",
      ink: "#e4e1d8",
      screen: "dot",
      art: "circuit",
      text: "A SKILL.md teaches your agent the Studio, and one Node file starts the harness you already use, signed in as you.",
      link: { label: "Read the agent skill", href: SKILL },
    },
  ]

  // The bridge's board runs on cue (no perpetual loop): by itself as its
  // card comes into view, then only while the reader scrolls.
  const BOARD_DANCE = 3000
  let boardMoving = $state(false)

  // The footer's columns.
  const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Get started",
      links: [
        { label: "Quick start", href: docsHref("getting-started") },
        { label: "Styling", href: docsHref("styling") },
        { label: "Seeds", href: docsHref("seeds") },
        { label: "Accessibility", href: docsHref("accessibility") },
      ],
    },
    {
      title: "Docs",
      links: DOCS_FAMILIES.map((f) => ({ label: f.label, href: f.href })),
    },
    {
      title: "For agents",
      links: [
        { label: "SKILL.md", href: SKILL },
        { label: "llms.txt", href: `${SITE}/llms.txt` },
        { label: "Registry", href: `${SITE}/agent/registry.json` },
        { label: "Studio", href: STUDIO },
      ],
    },
  ]
</script>

<div class="landing isolate flex min-h-screen flex-col bg-background text-foreground antialiased">
  <!-- The pointer prints on the whole page's ground, every section's:
       pinned to the viewport, the print scrolling with the page. -->
  <HeatTrail pinned class="page-trail" inks={TRAIL} cell={4} />
  <!-- Skip link: first focusable element, jumps to the single main landmark. -->
  <a
    href="#main"
    class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
  >
    Skip to content
  </a>

  <SiteHeader />

  <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
    <Hero />

    <div class="page">
      <Examples />

      <Plate plate={PLATES.afterExamples} />

      <!-- Ask: one agent session, played as the page scrolls past it. -->
      <section id="ask" aria-labelledby="ask-h" class="sec">
        <div use:rise class="sec-head">
          <h2 id="ask-h" class="section-title"><RiseWords text="Your agent builds the screen." /></h2>
          <div class="sec-side">
            <p data-rise class="sec-lede">
              Hand your coding agent the skill file and ask for a screen.
              <span class="lede-key">Each tool call lands on the canvas as a frame of kit parts</span>, and undo takes it
              back when it gets ideas.
            </p>
            <a data-rise href={SKILL} class="more-link">Read the agent skill</a>
          </div>
        </div>
        <AgentStory />
      </section>

      <!-- What's inside: the kit, the Studio, the bridge; then the docs' big
           families, each with its size and a line. -->
      <section id="inside" aria-labelledby="inside-h" class="sec">
        <div use:rise class="sec-head">
          <h2 id="inside-h" class="section-title"><RiseWords text="Three parts, one engine." /></h2>
          <div class="sec-side">
            <p data-rise class="sec-lede">
              A toolkit you copy into your repo, a Studio to play in, and a bridge to the coding agent you already trust.
              <span class="lede-key">No black boxes: all of it is code you can read.</span>
            </p>
          </div>
        </div>
        <ul use:rise class="inside">
          {#each INSIDE as c (c.title)}
            <li data-rise use:drive={{ dance: BOARD_DANCE, onChange: (m) => c.art === "circuit" && (boardMoving = m) }}>
              <div class="inside-art" aria-hidden="true">
                <DitherScreen screen={c.screen}>
                  {#if c.art === "circuit"}
                    <Circuit ink={c.ink} seed={11} density={1} pitch={3} paused={!boardMoving} />
                  {:else}
                    <DitherGradient from={c.ink} to={STOCK} direction="down" cell={4} />
                  {/if}
                </DitherScreen>
              </div>
              <span class="inside-who" aria-hidden="true"><DitherAvatar name={c.title} color={c.ink} size={56} /></span>
              <h3 class="inside-h"><PixelWord text={c.name} cell={5} /><span class="sr-only">{c.title}</span></h3>
              <p class="inside-p">{c.text}</p>
              <a href={c.link.href} class="more-link">{c.link.label}</a>
            </li>
          {/each}
        </ul>
        <div use:rise class="families">
          <h3 data-rise class="families-h">{SECTION_COUNT} docs sections, the five biggest families</h3>
          <ul class="families-list">
            {#each DOCS_FAMILIES as f (f.label)}
              <li data-rise>
                <a href={f.href} class="family-t"
                  ><span class="family-n">{f.count}<span class="family-u"> sections</span></span><span class="family-l">{f.label}</span></a
                >
                <p class="family-p">{f.note}</p>
              </li>
            {/each}
          </ul>
        </div>
      </section>

      <!-- The second plate: the heat builds up through the page to the
           close (plate.ts). -->
      <Plate plate={PLATES.afterParts} />

      <!-- What the kit meets on the reader's side. -->
      <WorksWith />

    </div>

    <!-- The close: the install in a clear field inside a print of heat, the
         footer's ramp (close.ts), its foot cut flat where the footer rises
         into it through one tab. -->
    <section
      id="install"
      bind:this={closeBand}
      aria-labelledby="install-h"
      class="close"
      style:--reach="{CLOSE.reach}px"
      onpointermove={() => heat.run()}
    >
      <HeatPrint paused={!heatMoving} />
      <div class="sec install">
        <div use:rise class="install-head">
          <h2 id="install-h" class="section-title"><RiseWords text="Copy one folder. Every pixel is yours." /></h2>
          <p data-rise class="sec-lede">
            Copy the kit into your app, add its {RUNTIME_DEPS.length} packages and import from
            <code>@dither-kit-svelte</code>.
            <span class="lede-key">Or paste the agent prompt and your agent does all three.</span>
          </p>
          <button type="button" class="key prompt-key" onclick={() => prompt.copy(PROMPT)}>
            {prompt.copied ? "Copied" : "Copy agent prompt"}
          </button>
          <span class="sr-only" role="status">{prompt.copied ? "Agent prompt copied" : ""}</span>
        </div>
        <InstallBlock />
        <p class="install-note">
          On Vue 3? The same kit ships as <code>dither-kit</code>, and the
          <a href={`${SITE}/docs/getting-started`} class="lead">Vue quick start</a> has its steps.
        </p>
        <dl use:rise class="sheet" aria-label="The kit in brief">
          {#each SPECS as s (s.label)}
            <div data-rise class="sheet-row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          {/each}
        </dl>
      </div>
      <span aria-hidden="true" class="close-tab"></span>
    </section>
  </main>

  <!-- Footer: the brand and a line beside three link columns, the copyright
       line, the line-screen wordmark under all. -->
  <footer class="foot">
    <div class="foot-in">
      <div class="foot-brand">
        <a href="#/" class="foot-name"
          ><BrandGather class="foot-lockup" scene={STAGINGS.foot} /><span class="sr-only">dither-ui</span></a
        >
        <p class="foot-line">
          A dithered UI toolkit for Svelte 5, the Vue kit's twin on the same engine. Printed one cell at a time.
        </p>
        <a href={GITHUB} target="_blank" rel="noreferrer" class="foot-gh"
          ><ToolMark id="github" size={13} />GitHub<span class="sr-only"> (opens in a new tab)</span></a
        >
      </div>
      {#each COLUMNS as col (col.title)}
        <nav class="foot-col" aria-label={col.title}>
          <h2 class="foot-h">{col.title}</h2>
          {#each col.links as l (l.label)}
            <a href={l.href}>{l.label}</a>
          {/each}
        </nav>
      {/each}
    </div>
    <p class="foot-copy">
      <span>© {new Date().getFullYear()} dither-ui.com</span>
      <span>v{VERSION}</span>
      <span>MIT license</span>
    </p>
    <div aria-hidden="true" class="foot-mark">
      <LineWordmark />
    </div>
  </footer>
</div>

<style>
  /* The pointer's print, on the page's ground under every section: fixed to
     the viewport, painted only while something cools (the kit's heat trail,
     `pinned`). The landing is its own stacking context, so it lies over the
     ground and under everything else. */
  :global(.page-trail) {
    position: fixed;
    inset: 0;
    z-index: -1;
  }

  /* The sections, on the page width with the rhythm between them. */
  .page {
    display: flex;
    flex-direction: column;
    gap: calc(var(--rhythm) * 3.5);
    width: min(100%, var(--page));
    margin-inline: auto;
    padding: calc(var(--rhythm) * 2) 24px 0;
  }

  .sec {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  /* What's inside: three cards, the raised ground like the bento's, each a
     tone strip over its title, two lines and its link. */
  .inside {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .inside > li {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    overflow: hidden;
    padding: 0 24px 24px;
    border-radius: 20px;
    background: var(--surface);
  }

  /* The strip: flush to the card's top and sides. */
  .inside-art {
    position: relative;
    align-self: stretch;
    height: 120px;
    margin: 0 -24px 8px;
  }

  /* The character: on the strip's foot, half over the card, like a mascot
     stepping out of its picture, on a plate of the card's ground so its own
     ink never melts into the strip's. */
  .inside-who {
    position: absolute;
    top: calc(120px - 42px);
    right: 18px;
    padding: 6px;
    border-radius: 14px;
    background: var(--surface);
  }

  /* The name, chunky in the pixel face. */
  .inside-h {
    display: flex;
    margin: 4px 0 0;
    color: var(--ink);
  }

  .inside-p {
    flex: 1;
    margin: 0;
    font-size: 13px;
    line-height: 1.65;
    color: var(--ink-3);
    text-wrap: pretty;
  }

  /* The families: five columns, each its size as a big figure over its
     name (the docs link), a line. */
  .families {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 28px;
  }

  .families-h {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
  }

  .families-list {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0 24px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .families-list li {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .family-t {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    color: var(--ink);
    transition: color 150ms var(--ease-settle);
  }

  .family-t:hover {
    color: var(--signal);
  }

  /* The figure's unit beside it: these count docs sections, not the kit's
     components (the bento's figure). */
  .family-u {
    font-size: 12px;
    font-weight: 400;
    color: var(--ink-3);
  }

  .family-n {
    font-size: 2.4rem;
    font-weight: 500;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .family-l {
    font-size: 13px;
  }

  .family-p {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink-3);
    text-wrap: pretty;
  }

  /* The close: a full-width band, padded by the heat's reach (`--reach`,
     `CLOSE.reach`) plus air so no ink lands under a word; the heat its ground. */
  .close {
    position: relative;
    isolation: isolate;
    /* open ground above it, so its heat rises out of the page */
    margin-top: calc(var(--rhythm) * 1.5);
    padding: calc(var(--reach) + var(--rhythm)) 24px calc(var(--reach) + var(--rhythm) * 1.5);
  }

  /* The one joint: the footer's ground rises into the heat's flat foot as a
     tab on the page's axis, its shoulders rounded and its base flowing into
     the ground through two concave fillets. */
  .close-tab {
    --r: 16px;
    position: absolute;
    bottom: 0;
    left: 50%;
    width: clamp(120px, 28vw, 224px);
    height: 40px;
    translate: -50% 0;
    border-radius: var(--r) var(--r) 0 0;
    background: var(--background);
  }

  .close-tab::before,
  .close-tab::after {
    content: "";
    position: absolute;
    bottom: 0;
    width: var(--r);
    height: var(--r);
  }

  .close-tab::before {
    right: 100%;
    background: radial-gradient(circle at 0 0, transparent var(--r), var(--background) calc(var(--r) + 0.5px));
  }

  .close-tab::after {
    left: 100%;
    background: radial-gradient(circle at 100% 0, transparent var(--r), var(--background) calc(var(--r) + 0.5px));
  }

  /* The install: its head centred, the box under it. */
  .install {
    width: min(100%, 64rem);
    margin-inline: auto;
  }

  .install-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
  }

  .install-head .sec-lede {
    max-width: 34rem;
  }

  .prompt-key {
    height: 36px;
    padding-inline: 16px;
    cursor: pointer;
  }

  /* The spec sheet closing the install: label and value rows on the raised
     ground, two columns of rows from 640px, no rules between them. */
  .sheet {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 40px;
    margin: 8px 0 0;
    padding: 18px 24px;
    border-radius: 16px;
    background: var(--surface);
  }

  .sheet-row {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 12px;
    padding-block: 7px;
    font-size: 12px;
    line-height: 1.6;
  }

  .sheet-row dt {
    color: var(--ink-3);
  }

  .sheet-row dd {
    margin: 0;
    color: var(--ink);
  }

  .install-note {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    text-align: center;
    color: var(--ink-3);
  }

  /* The footer: the brand (the lockup, a line, GitHub) beside three link
     columns, the copyright line, the line-screen wordmark under all. Three
     columns under the brand under 900px, two under 640px. */
  .foot {
    position: relative;
    isolation: isolate;
    overflow: hidden;
  }

  /* Positioned: the brand's field is the page's column. */
  .foot-in {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
    gap: 32px;
    width: 100%;
    max-width: var(--page);
    margin-inline: auto;
    /* Clear of the floating header where the page comes to rest, the
       footer's top row at the viewport's top. */
    padding: calc(var(--head) + 40px) 1.5rem 24px;
  }

  .foot-brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .foot-name {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    color: var(--ink);
  }

  .foot-name :global(.foot-lockup) {
    position: relative;
  }

  .foot-line {
    max-width: 22rem;
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink-3);
  }

  .foot-gh {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 24px;
    font-size: 12px;
    color: var(--ink-3);
    transition: color 150ms var(--ease-settle);
  }

  .foot-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-size: 12px;
  }

  .foot-h {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink);
  }

  .foot-col a {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    min-height: 28px;
    padding-top: 6px;
    color: var(--ink-3);
    transition: color 150ms var(--ease-settle);
  }


  .foot-col a:hover,
  .foot-gh:hover {
    color: var(--ink);
  }

  .foot-copy {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    width: 100%;
    max-width: var(--page);
    margin: 0 auto;
    padding: 0 1.5rem;
    font-size: 11px;
    color: var(--ink-3);
  }

  /* The wordmark: the page's full width, at the page's foot. */
  .foot-mark {
    max-width: var(--page);
    margin-inline: auto;
    padding: 40px 1.5rem;
  }

  @media (max-width: 1023px) {
    .families-list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      row-gap: 24px;
    }
  }

  @media (max-width: 899px) {
    .inside {
      grid-template-columns: minmax(0, 1fr);
    }
    .foot-in {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .foot-brand {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 639px) {
    .page {
      gap: calc(var(--rhythm) * 2.5);
      padding-inline: 16px;
    }
    .families-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .inside-art {
      height: 72px;
    }
    .inside-who {
      top: calc(72px - 42px);
    }
    .foot-in {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding-inline: 16px;
    }
    .sheet {
      grid-template-columns: minmax(0, 1fr);
      padding: 12px 16px;
    }
    .foot-copy,
    .foot-mark {
      padding-inline: 16px;
    }
  }
</style>
