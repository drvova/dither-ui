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
  import { DitherGradient, DitherScreen, type ScreenKind } from "@dither-kit-svelte"
  import "../../../src/shared/fonts/display.css"
  import type { MarkId } from "../../../src/shared/ui/marks"
  import { copier } from "../copy.svelte"
  import "./landing.css"
  import AgentStory from "./AgentStory.svelte"
  import BrandGather from "./BrandGather.svelte"
  import BrandMark from "./BrandMark.svelte"
  import { STAGINGS } from "./brand"
  import Examples from "./Examples.svelte"
  import { DOCS_FAMILIES, RUNTIME_DEPS, SECTION_COUNT, SPECS, VERSION, docsHref } from "./facts"
  import Hero from "./Hero.svelte"
  import InstallBlock from "./InstallBlock.svelte"
  import LineWordmark from "./LineWordmark.svelte"
  import { GITHUB, SITE, STUDIO } from "./links"
  import Plate from "./Plate.svelte"
  import { PLATES, STOCK } from "./plate"
  import ToolMark from "./ToolMark.svelte"

  const SKILL = `${SITE}/agent/SKILL.md`

  // What "Copy agent prompt" puts on the clipboard: the install to run.
  const PROMPT = [
    "Add the dither-ui Svelte kit to this project:",
    "copy it with `npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte`,",
    `install ${RUNTIME_DEPS.join(", ")}, alias @dither-kit-svelte to src/dither-kit-svelte/index.ts,`,
    "then build what I ask from its components.",
  ].join(" ")
  const prompt = copier()

  // The harnesses `bridge/dither-bridge.mjs` knows (its HARNESSES: ids and
  // names), in its order, each under the tool's own mark. Keep in sync.
  const HARNESSES: { id: MarkId; name: string }[] = [
    { id: "claude", name: "Claude Code" },
    { id: "codex", name: "Codex" },
    { id: "gemini", name: "Gemini CLI" },
    { id: "qwen", name: "Qwen Code" },
    { id: "omp", name: "oh-my-pi" },
    { id: "goose", name: "Goose" },
    { id: "opencode", name: "OpenCode" },
    { id: "auggie", name: "Auggie" },
  ]

  // What's inside: the kit, the Studio and the bridge, each a card headed by
  // a tone strip the kit prints in its own ink through its own printer's
  // screen (blue in Bayer cells, the ember in lines, bone in a halftone
  // dot), then its title, two lines and the link that leads on.
  const INSIDE: {
    title: string
    ink: string
    screen: ScreenKind
    text: string
    link: { label: string; href: string }
    harnesses?: boolean
  }[] = [
    {
      title: "The kit",
      ink: "blue",
      screen: "bayer",
      text: "Plain source you own: one engine of rasters under every component, written in Svelte 5 runes.",
      link: { label: "Read the quick start", href: docsHref("getting-started") },
    },
    {
      title: "The Studio",
      ink: "orange",
      screen: "line",
      text: "An infinite canvas for screens of kit parts, each frame exported as Vue, a PNG or an MP4.",
      link: { label: "Open the studio", href: STUDIO },
    },
    {
      title: "The agent bridge",
      ink: "#e4e1d8",
      screen: "dot",
      text: "A SKILL.md teaches your agent the Studio; one Node file starts the harness you already use.",
      link: { label: "Read the agent skill", href: SKILL },
      harnesses: true,
    },
  ]

  // The footer's columns; the docs families carry their size.
  const COLUMNS: { title: string; links: { label: string; href: string; n?: number }[] }[] = [
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
      links: DOCS_FAMILIES.map((f) => ({ label: f.label, href: f.href, n: f.count })),
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

<div class="landing flex min-h-screen flex-col bg-background text-foreground antialiased">
  <!-- Skip link: first focusable element, jumps to the single main landmark. -->
  <a
    href="#main"
    class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
  >
    Skip to content
  </a>

  <!-- Header: a floating capsule on the raised ground, sticky over the page.
       Sticky is positioned, and z-10 keeps it over main, which isolates the
       page art. -->
  <header class="site-head sticky top-0 z-10">
    <div class="site-capsule text-xs">
      <a href="#/" class="flex h-8 items-center gap-2.5 pl-2 whitespace-nowrap">
        <BrandMark size={13} />
        dither-ui
      </a>
      <nav class="flex items-center text-muted-foreground" aria-label="Site">
        <a href="#examples" class="nav-a hidden sm:inline-flex">Components</a>
        <a href={docsHref()} class="nav-a">Docs</a>
        <a href="#ask" class="nav-a hidden sm:inline-flex">Agents</a>
        <a href={GITHUB} target="_blank" rel="noreferrer" class="nav-a hidden md:inline-flex"
          ><ToolMark id="github" size={13} />GitHub<span class="sr-only"> (opens in a new tab)</span></a
        >
      </nav>
      <a href={STUDIO} class="nav-a key-chrome studio-key">Open studio</a>
    </div>
  </header>

  <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
    <Hero />

    <div class="page">
      <Examples />

      <Plate plate={PLATES.afterExamples} />

      <!-- Ask: one agent session, played as the page scrolls past it. -->
      <section id="ask" aria-labelledby="ask-h" class="sec">
        <div class="sec-head">
          <h2 id="ask-h" class="section-title chrome-type">Your agent builds the screen.</h2>
          <div class="sec-side">
            <p class="sec-lede">
              Give your coding agent the skill file, then ask for a screen. Each tool call lands on the canvas as a frame
              of kit parts, and undo takes it back.
            </p>
            <a href={SKILL} class="more-link">Read the agent skill</a>
          </div>
        </div>
        <AgentStory />
      </section>

      <!-- What's inside: the kit, the Studio, the bridge; then the docs' big
           families, each with its size and a line. -->
      <section id="inside" aria-labelledby="inside-h" class="sec">
        <div class="sec-head">
          <h2 id="inside-h" class="section-title chrome-type">Three parts, one engine.</h2>
          <div class="sec-side">
            <p class="sec-lede">
              A toolkit you copy into your repo, a Studio to compose with it, and a bridge that hands the Studio to the
              coding agent you already use. All of it is code you can read.
            </p>
          </div>
        </div>
        <ul class="inside">
          {#each INSIDE as c (c.title)}
            <li>
              <div class="inside-art" aria-hidden="true">
                <DitherScreen screen={c.screen}>
                  <DitherGradient from={c.ink} to={STOCK} direction="down" cell={4} />
                </DitherScreen>
              </div>
              <h3 class="inside-h"><span class="inside-cell" aria-hidden="true"></span>{c.title}</h3>
              <p class="inside-p">{c.text}</p>
              {#if c.harnesses}
                <ul class="marks" aria-label="Harnesses the bridge starts">
                  {#each HARNESSES as h (h.id)}
                    <li><ToolMark id={h.id} size={13} />{h.name}</li>
                  {/each}
                </ul>
              {/if}
              <a href={c.link.href} class="more-link">{c.link.label}</a>
            </li>
          {/each}
        </ul>
        <div class="families">
          <h3 class="families-h">{SECTION_COUNT} docs sections, the five biggest families</h3>
          <ul class="families-list">
            {#each DOCS_FAMILIES as f (f.label)}
              <li>
                <a href={f.href} class="family-t"
                  ><span class="family-n">{f.count}</span><span class="family-l">{f.label}</span></a
                >
                <p class="family-p">{f.note}</p>
              </li>
            {/each}
          </ul>
        </div>
      </section>

      <Plate plate={PLATES.beforeInstall} />

      <!-- The install, centred. -->
      <section id="install" aria-labelledby="install-h" class="sec install">
        <div class="install-head">
          <h2 id="install-h" class="section-title chrome-type">Copy one folder. Every pixel is yours.</h2>
          <p class="sec-lede">
            Copy the kit into your app, add its {RUNTIME_DEPS.length} packages and import from
            <code>@dither-kit-svelte</code>. Or paste the agent prompt and your agent does all three.
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
        <dl class="sheet" aria-label="The kit in brief">
          {#each SPECS as s (s.label)}
            <div class="sheet-row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          {/each}
        </dl>
      </section>
    </div>
  </main>

  <!-- Footer: the brand and a line beside three link columns, the copyright
       line, the line-screen wordmark under all. -->
  <footer class="foot">
    <div class="foot-in">
      <div class="foot-brand">
        <a href="#/" class="foot-name"
          ><BrandGather class="foot-lockup" scene={STAGINGS.foot} /><span class="sr-only">dither-ui</span></a
        >
        <p class="foot-line">A dithered UI toolkit for Svelte 5, the Vue kit's twin on the same engine.</p>
        <a href={GITHUB} target="_blank" rel="noreferrer" class="foot-gh"
          ><ToolMark id="github" size={13} />GitHub<span class="sr-only"> (opens in a new tab)</span></a
        >
      </div>
      {#each COLUMNS as col (col.title)}
        <nav class="foot-col" aria-label={col.title}>
          <h2 class="foot-h">{col.title}</h2>
          {#each col.links as l (l.label)}
            <a href={l.href}
              >{l.label}{#if l.n}<span class="foot-n"
                  ><span class="sr-only">, </span>{l.n}<span class="sr-only"> sections</span></span
                >{/if}</a
            >
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
  /* The header: a capsule on the raised ground floating over the page,
     centred, lifted by its shadow alone. */
  .site-head {
    padding: 8px 16px;
  }

  .site-capsule {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: min(100%, 48rem);
    height: 48px;
    margin-inline: auto;
    padding: 0 7px 0 10px;
    border-radius: 999px;
    background: var(--surface);
    box-shadow: var(--float-shadow);
  }

  @media (forced-colors: active) {
    .site-capsule {
      border: 1px solid CanvasText;
    }
  }

  .studio-key {
    height: 34px;
    padding-inline: 16px;
  }

  /* The sections, on the page width with the rhythm between them. */
  .page {
    display: flex;
    flex-direction: column;
    gap: calc(var(--rhythm) * 3.5);
    width: min(100%, var(--page));
    margin-inline: auto;
    padding: calc(var(--rhythm) * 2) 24px calc(var(--rhythm) * 3);
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

  .inside-h {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
  }

  /* The ember cell beside each title: the kit's own unit. */
  .inside-cell {
    width: 6px;
    height: 6px;
    background: var(--signal);
  }

  .inside-p {
    flex: 1;
    margin: 0;
    font-size: 13px;
    line-height: 1.65;
    color: var(--ink-3);
    text-wrap: pretty;
  }

  .marks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 11.5px;
    color: var(--ink-3);
  }

  .marks li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
    padding: 48px 1.5rem 24px;
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

  .foot-n {
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    color: var(--ink-3);
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
