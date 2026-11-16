// The landing, printed in the dark, always: one bone ink on obsidian, the
// kit's art the only colour on it. The hero (the statement beside the
// stage, seated on a poster the kit prints), then sections under a title
// with a lead beside it: a bento of live kit components, the screen an
// agent's ask makes, what's inside (the kit, the Studio, the bridge; the
// docs' families) and the install, with a plate of the brand small in a
// wide field between them, and a footer of the brand and link columns on the
// kit's light trails, the line-screen wordmark printed over them. Michroma for display, mono for the rest; everything
// that moves is the kit.
//
// A static page (`shared/lib/island`): what is here is the page's bytes,
// and what moves is an island of `LANDING` (`islands.ts`), woken in the
// browser as it nears the view.
import { For } from "solid-js"
import { DitherAvatar } from "@dither-ui/kit"
import "@/shared/fonts/display.css"
import "@/pages/landing/chapters.css"
import { BUILD_CELLS } from "@/pages/landing/build"
import { RUNTIME_DEPS, SPECS } from "@/pages/landing/facts"
import { CLOSE } from "@/pages/landing/heat"
import { DOCS_FAMILIES, SECTION_COUNT } from "@/pages/landing/hub"
import { INSIDE } from "@/pages/landing/inside"
import { assetPath, routePath } from "@/shared/lib/routes"
import { LANDING } from "./islands"
import PixelWord from "./PixelWord"
import RiseWords from "./RiseWords"
import WorksWith from "./WorksWith"
import "./LandingPage.css"

// The five biggest families, biggest first (the footer keeps the docs' order).
const BIGGEST = [...DOCS_FAMILIES].sort((a, b) => b.count - a.count)

export default function LandingPage() {
  return (
    <div class="landing-page-scope landing isolate flex min-h-screen flex-col bg-background text-foreground antialiased">
      <LANDING.trail />
      {/* Skip link: first focusable element, jumps to the single main landmark. */}
      <a
        href="#main"
        class="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-ring focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
      >
        Skip to content
      </a>

      <LANDING.header />

      <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
        {/* The hero, our own: the statement beside the stage, seated on a
            poster the kit prints. */}
        <LANDING.hero />

        <div class="page">
          <LANDING.bento />

          <LANDING.plate plate="afterExamples" />

          {/* The build: the brand itself, cell by cell, raised by the world
              engine as the page scrolls past it. */}
          <section id="build" aria-labelledby="build-h" class="sec">
            <div class="sec-head rise">
              <h2 id="build-h" class="section-title">
                <RiseWords text="Built from the wire up." />
              </h2>
              <div class="sec-side">
                <p data-rise class="sec-lede">
                  Our mark and name in {BUILD_CELLS} cells, each one a block,{" "}
                  <span class="lede-key">raised by the kit's world engine as you scroll</span>: the floor first, then
                  each cell landing hot on it and cooling to metal. Keep going and it comes apart. Point at it and the
                  cells lean away.
                </p>
                <a data-rise href={routePath("/docs/world")} class="more-link" style={{ "--rise-n": 1 }}>
                  See the world engine
                </a>
              </div>
            </div>
            <LANDING.build />
          </section>

          {/* Ask: one agent session, played as the page scrolls past it. */}
          <section id="ask" aria-labelledby="ask-h" class="sec">
            <div class="sec-head rise">
              <h2 id="ask-h" class="section-title">
                <RiseWords text="Your agent builds the screen." />
              </h2>
              <div class="sec-side">
                <p data-rise class="sec-lede">
                  Hand your coding agent the skill file and ask for a screen.{" "}
                  <span class="lede-key">Each tool call lands on the canvas as a frame of kit parts</span>, and undo
                  takes it back when it gets ideas.
                </p>
                <a data-rise href={assetPath("/agent/SKILL.md")} class="more-link" style={{ "--rise-n": 1 }}>
                  Read the agent skill
                </a>
              </div>
            </div>
            <LANDING.ask />
          </section>

          {/* What's inside: the kit, the Studio, the bridge; then the docs'
              big families, each with its size and a line. */}
          <section id="inside" aria-labelledby="inside-h" class="sec">
            <div class="sec-head rise">
              <h2 id="inside-h" class="section-title">
                <RiseWords text="Three parts, one engine." />
              </h2>
              <div class="sec-side">
                <p data-rise class="sec-lede">
                  A toolkit you copy into your repo, a Studio to play in, and a bridge to the coding agent you already
                  trust. <span class="lede-key">No black boxes: all of it is code you can read.</span>
                </p>
              </div>
            </div>
            <ul class="inside rise">
              <For each={INSIDE}>
                {(c, i) => (
                  <li data-rise data-press="card" style={{ "--rise-n": i() }}>
                    <LANDING.inside name={c.name} />
                    <span class="inside-who" aria-hidden="true">
                      <DitherAvatar name={c.title} color={c.ink} size={56} animate={false} />
                    </span>
                    <h3 class="inside-h">
                      <PixelWord text={c.name} cell={5} />
                      <span class="sr-only">{c.title}</span>
                    </h3>
                    <p class="inside-p">{c.text}</p>
                    <a href={c.link.href} class="more-link">
                      {c.link.label}
                    </a>
                  </li>
                )}
              </For>
            </ul>
            <div class="families rise">
              <h3 data-rise class="families-h">
                {SECTION_COUNT} docs sections, the five biggest families
              </h3>
              <ul class="families-list">
                <For each={BIGGEST}>
                  {(f, i) => (
                    <li data-rise style={{ "--rise-n": i() + 1 }}>
                      <a href={routePath(`/docs/${f.first}`)} class="family-t" data-press="key">
                        <span class="family-n">
                          {f.count}
                          <span class="family-u"> sections</span>
                        </span>
                        <span class="family-l">{f.label}</span>
                      </a>
                      <p class="family-p">{f.note}</p>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </section>

          {/* The second plate: the heat builds up through the page to the
              close (plate.ts). */}
          <LANDING.plate plate="afterParts" />

          {/* What the kit meets on the reader's side. */}
          <WorksWith />
        </div>

        {/* The close: the install in a clear field inside a print of heat,
            the footer's own ramp (close.ts), its foot cut flat where the
            footer rises into it through one tab. */}
        <section id="install" aria-labelledby="install-h" class="close" style={{ "--reach": `${CLOSE.reach}px` }}>
          <LANDING.heat />
          <div class="sec install">
            <div class="install-head rise">
              <h2 id="install-h" class="section-title">
                <RiseWords text="Copy one folder. Every pixel is yours." />
              </h2>
              <p data-rise class="sec-lede">
                Copy the kit into your app, add its {RUNTIME_DEPS.length} packages and import from{" "}
                <code>@dither-kit</code>.{" "}
                <span class="lede-key">Or paste the agent prompt and your agent does all three.</span>
              </p>
              <LANDING.prompt />
            </div>
            <LANDING.install />
            <dl class="sheet rise" aria-label="The kit in brief">
              <For each={SPECS}>
                {(s) => (
                  <div data-rise class="sheet-row">
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                )}
              </For>
            </dl>
          </div>
          <span aria-hidden="true" class="close-tab" />
        </section>
      </main>

      {/* Footer: on the kit's art, the brand and a line beside three link
          columns, the copyright line and the road the trails sweep across,
          the line-screen wordmark printed over its foot. */}
      <LANDING.foot />
    </div>
  )
}
