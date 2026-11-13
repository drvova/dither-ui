// The landing, printed in the dark, always: one bone ink on obsidian, the
// kit's art the only colour on it. The hero (the statement beside the
// stage, seated on a poster the kit prints), then sections under a title
// with a lead beside it: a bento of live kit components, the screen an
// agent's ask makes, what's inside (the kit, the Studio, the bridge; the
// docs' families) and the install, with a plate of the brand small in a
// wide field between them, and a footer of the brand and link columns on the
// kit's light trails, the line-screen wordmark printed over them. Michroma for display, mono for the rest; everything
// that moves is the kit.
import { createEffect, createSignal, For, lazy, on, onCleanup, onMount, Show } from "solid-js"
import {
  DitherAvatar,
  DitherCircuit,
  DitherClipboard,
  DitherGradient,
  DitherHeatTrail,
  DitherIcon,
  DitherReveal,
  DitherScreen,
  type PixelColor,
  type ScreenKind,
} from "@dither-kit"
import "@/shared/fonts/display.css"
import "@/pages/landing/chapters.css"
import { STAGINGS } from "@/pages/landing/brand"
import { BUILD_CELLS } from "@/pages/landing/build"
import { RUNTIME_DEPS, SPECS } from "@/pages/landing/facts"
import { CLOSE } from "@/pages/landing/heat"
import { DOCS_FAMILIES, SECTION_COUNT } from "@/pages/landing/hub"
import { PLATES, RAMP, STOCK, TRAIL } from "@/pages/landing/plate"
import { ROAD, ROAD_SHADER, WORDMARK } from "@/pages/landing/road"
import { assetPath, rise, routePath } from "~/shared/lib"
import BrandMark from "~/shared/ui/BrandMark"
import MascotCar from "~/shared/ui/MascotCar"
import ToolMark from "~/shared/ui/ToolMark"
import { SiteHeader } from "~/widgets/site-header"
import { version } from "../../../../package.json"
import AgentStory from "./AgentStory"
import BrandBuild from "./BrandBuild"
import BrandGather from "./BrandGather"
import Examples from "./Examples"
import HeatPrint from "./HeatPrint"
import InstallBlock from "./InstallBlock"
import LineWordmark from "./LineWordmark"
import PixelWord from "./PixelWord"
import Plate from "./Plate"
import RiseWords from "./RiseWords"
import Showcase from "./Showcase"
import WorksWith from "./WorksWith"
import { useDrive } from "./drive"
import "./LandingPage.css"

// The five biggest families, biggest first (the footer keeps the docs' order).
const BIGGEST = [...DOCS_FAMILIES].sort((a, b) => b.count - a.count)

/** How long the bridge's board runs by itself as its card comes into view. */
const BOARD_DANCE = 3000

// What's inside: the kit, the Studio and the bridge, each a card headed by a
// strip the kit prints in its own ink through its own printer's screen
// (blue in Bayer cells, the ember in lines, bone in a halftone dot): a tone
// for the kit and the Studio, a circuit board for the bridge, its signals
// running between the tab and the agent in the ember; its own
// character (the kit's seeded avatar of its title, in its ink) standing on
// the strip's foot, its name in the pixel face, two lines and its link.
const INSIDE: {
  title: string
  name: string
  ink: PixelColor
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
    text: "Plain source you own, one engine of rasters and a seekable clock under every component. Change anything, it's yours.",
    link: { label: "Read the quick start", href: routePath("/docs/getting-started") },
  },
  {
    title: "The Studio",
    name: "studio",
    ink: "orange",
    screen: "line",
    art: "tone",
    text: "An infinite canvas to play with screens of kit parts. Export a frame as Solid, a PNG or an MP4, then go again.",
    link: { label: "Open the studio", href: routePath("/studio") },
  },
  {
    title: "The agent bridge",
    name: "bridge",
    ink: "#e4e1d8",
    screen: "dot",
    art: "circuit",
    text: "A SKILL.md teaches your agent the Studio, and one Node file starts the harness you already use, signed in as you.",
    link: { label: "Read the agent skill", href: assetPath("/agent/SKILL.md") },
  },
]

// The footer's ground (`road.ts`), loaded with it: its own chunk, fetched
// once the page has mounted, never rendered on a server.
const DitherShader = lazy(() => import("@dither-kit/solid/DitherShader"))

// One row of the wordmark's screen below its ink's top: the first rows are
// hairlines, so the wheels stand where the letters read solid.
const carBottom = (1 - (WORDMARK.TOP + (WORDMARK.BASE - WORDMARK.TOP) / WORDMARK.ROWS) / WORDMARK.H) * 100
const CAR_SPEED = 0.16 // px a ms
const carStill = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

// The footer's columns.
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Get started",
    links: [
      { label: "Quick start", href: routePath("/docs/getting-started") },
      { label: "Styling", href: routePath("/docs/styling") },
      { label: "Seeds", href: routePath("/docs/seeds") },
      { label: "Accessibility", href: routePath("/docs/accessibility") },
      { label: "Verification", href: routePath("/docs/verification") },
    ],
  },
  {
    title: "Docs",
    links: DOCS_FAMILIES.map((f) => ({ label: f.label, href: routePath(`/docs/${f.first}`) })),
  },
  {
    title: "For agents",
    links: [
      { label: "SKILL.md", href: assetPath("/agent/SKILL.md") },
      { label: "llms.txt", href: assetPath("/llms.txt") },
      { label: "Registry", href: assetPath("/agent/registry.json") },
      { label: "Studio", href: routePath("/studio") },
    ],
  },
]

export default function LandingPage() {
  // What "Copy agent prompt" puts on the clipboard: the skill to read and the
  // install to run, pointed at wherever this page is served from.
  const [prompt, setPrompt] = createSignal("")
  const [mounted, setMounted] = createSignal(false)
  onMount(() => {
    // The landing is always dark (the user's call): a light theme toggled on
    // the docs or the Studio persists on <html> across the site's pages, so
    // dark is re-asserted here; storage keeps the user's choice and the docs
    // and the Studio re-read it.
    document.documentElement.classList.add("dark")
    setPrompt(
      [
        `Read ${location.origin}${assetPath("/agent/SKILL.md")} and add dither-ui to this project:`,
        "copy the kit with `npx degit drvova/dither-ui/dither-kit src/dither-kit`,",
        "install d3-scale, d3-shape, clsx and tailwind-merge, alias @dither-kit to src/dither-kit/tailwind,",
        "then build what I ask from its components.",
      ].join(" "),
    )
    setMounted(true)
  })

  // The footer's ground dances by itself for `ROAD.dance` as the road comes
  // into view, once the footer's brand is home, then moves only while the
  // reader moves the page (a scroll, a pointer across the footer) and
  // settles as they stop: under five seconds on its own, so it carries no
  // pause. It holds while the brand forms (one moving layer at a time).
  const [footStill, setFootStill] = createSignal(true)
  const { driven, drive, running } = useDrive()
  let road: HTMLDivElement | undefined
  // The bridge's board (What's inside) runs the same way: its signals run as
  // its card comes into view, then only while the reader moves the page.
  const board = useDrive()
  // The close's heat drifts as its band arrives, then only under the hand.
  const heat = useDrive()
  let closeBand: HTMLElement | undefined
  let closeSeen: IntersectionObserver | null = null
  let boardCard: HTMLElement | undefined
  let boardInView = false
  // A scroll drives only what is on screen: the road off screen stays still
  // (driving it from anywhere ran the car's loop through the whole page).
  let roadNear = false
  const scrolled = () => {
    if (roadNear) drive()
    if (boardInView) board.drive()
  }
  // The dance, once per time the road comes into view, waiting for the brand.
  let inView = false
  let danced = false
  function dance() {
    if (!inView || danced || !footStill()) return
    danced = true
    drive(ROAD.dance)
  }
  // A brand that starts forming mid-dance takes the stage; the dance comes
  // back once it is home.
  function forming() {
    setFootStill(false)
    if (running()) danced = false
  }
  function homed() {
    setFootStill(true)
    dance()
  }
  // The mascot's car on the road: it drives exactly while the art moves (the
  // dance, then the reader's scroll or pointer), so the reader drives it, and
  // parks as the art settles; under reduced motion it stays parked. Its
  // wheels stand on the wordmark's top; it leaves at the right of the
  // wordmark's box and comes back in at its left.
  let car: HTMLDivElement | undefined
  const [carX, setCarX] = createSignal(0)
  let carRaf = 0
  let carLast = 0
  // The road's width and the car's, kept by a ResizeObserver: read in the
  // frame loop they forced a layout every frame of the drive.
  let roadWidth = 0
  let carWidth = 0
  let carSizes: ResizeObserver | null = null
  const moving = () => driven() && footStill()
  function roll(now: number) {
    const dt = Math.min(64, now - carLast)
    carLast = now
    const x = carX() + dt * CAR_SPEED
    setCarX(x > roadWidth ? -carWidth : x)
    carRaf = moving() ? requestAnimationFrame(roll) : 0
  }
  createEffect(
    on(
      moving,
      (now) => {
        if (!now || carRaf || carStill()) return
        carLast = performance.now()
        carRaf = requestAnimationFrame(roll)
      },
      { defer: true },
    ),
  )
  let seen: IntersectionObserver | null = null
  let boardSeen: IntersectionObserver | null = null
  onMount(() => {
    onCleanup(() => {
      cancelAnimationFrame(carRaf)
      removeEventListener("scroll", scrolled)
      seen?.disconnect()
      carSizes?.disconnect()
      boardSeen?.disconnect()
      closeSeen?.disconnect()
    })
    addEventListener("scroll", scrolled, { passive: true })
    if (typeof IntersectionObserver === "undefined") return
    if (boardCard) {
      boardSeen = new IntersectionObserver(
        ([entry]) => {
          const was = boardInView
          boardInView = !!entry?.isIntersecting
          if (boardInView && !was) board.drive(BOARD_DANCE)
        },
        { threshold: 0.5 },
      )
      boardSeen.observe(boardCard)
    }
    if (closeBand) {
      closeSeen = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return
          heat.drive(CLOSE.drift)
          closeSeen?.disconnect()
        },
        { threshold: 0.25 },
      )
      closeSeen.observe(closeBand)
    }
    if (!road) return
    seen = new IntersectionObserver(
      ([entry]) => {
        roadNear = !!entry?.isIntersecting
        inView = roadNear && entry.intersectionRatio >= 0.5
        if (inView) dance()
        else danced = false
      },
      { threshold: [0, 0.5] },
    )
    seen.observe(road)
    if (car && typeof ResizeObserver !== "undefined") {
      const track = car.parentElement
      carSizes = new ResizeObserver(() => {
        roadWidth = track?.clientWidth ?? 0
        carWidth = car?.offsetWidth ?? 0
      })
      if (track) carSizes.observe(track)
      carSizes.observe(car)
    }
  })

  return (
    <div class="landing-page-scope landing isolate flex min-h-screen flex-col bg-background text-foreground antialiased">
      {/* The pointer prints on the whole page's ground, every section's:
          pinned to the viewport, the print scrolling with the page. */}
      <DitherHeatTrail pinned class="page-trail" {...TRAIL} cell={4} />
      {/* Skip link: first focusable element, jumps to the single main landmark. */}
      <a
        href="#main"
        class="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-ring focus:bg-background focus:px-4 focus:py-2 focus:text-xs"
      >
        Skip to content
      </a>

      <SiteHeader current="landing" />

      <main id="main" tabindex="-1" class="relative isolate flex flex-1 flex-col outline-none">
        {/* The hero, our own: the statement beside the stage, seated on a
            poster the kit prints. */}
        <Showcase />

        <div class="page">
          <Examples />

          <Plate plate={PLATES.afterExamples} />

          {/* The build: the brand itself, cell by cell, raised by the world
              engine as the page scrolls past it. */}
          <section id="build" aria-labelledby="build-h" class="sec">
            <div ref={rise} class="sec-head">
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
                <a data-rise href={routePath("/docs/world")} class="more-link">
                  See the world engine
                </a>
              </div>
            </div>
            <BrandBuild />
          </section>

          {/* Ask: one agent session, played as the page scrolls past it. */}
          <section id="ask" aria-labelledby="ask-h" class="sec">
            <div ref={rise} class="sec-head">
              <h2 id="ask-h" class="section-title">
                <RiseWords text="Your agent builds the screen." />
              </h2>
              <div class="sec-side">
                <p data-rise class="sec-lede">
                  Hand your coding agent the skill file and ask for a screen.{" "}
                  <span class="lede-key">Each tool call lands on the canvas as a frame of kit parts</span>, and undo
                  takes it back when it gets ideas.
                </p>
                <a data-rise href={assetPath("/agent/SKILL.md")} class="more-link">
                  Read the agent skill
                </a>
              </div>
            </div>
            <AgentStory />
          </section>

          {/* What's inside: the kit, the Studio, the bridge; then the docs'
              big families, each with its size and a line. */}
          <section id="inside" aria-labelledby="inside-h" class="sec">
            <div ref={rise} class="sec-head">
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
            <ul ref={rise} class="inside">
              <For each={INSIDE}>
                {(c) => (
                  <li data-rise ref={(el) => c.art === "circuit" && (boardCard = el)}>
                    {/* The strip is decoration: what the kit prints in it is
                        hidden from assistive technology by itself. */}
                    <DitherScreen screen={c.screen}>
                      <DitherReveal class="inside-art" duration={0.72} easing="glide" aria-hidden="true">
                        <Show
                          when={c.art === "circuit"}
                          fallback={<DitherGradient from={c.ink} to={STOCK} direction="down" cell={4} />}
                        >
                          <DitherCircuit ink={c.ink} seed={11} density={1} pitch={3} paused={!board.driven()} />
                        </Show>
                      </DitherReveal>
                    </DitherScreen>
                    <span class="inside-who" aria-hidden="true">
                      <DitherAvatar name={c.title} color={c.ink} size={56} />
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
            <div ref={rise} class="families">
              <h3 data-rise class="families-h">
                {SECTION_COUNT} docs sections, the five biggest families
              </h3>
              <ul class="families-list">
                <For each={BIGGEST}>
                  {(f) => (
                    <li data-rise>
                      <a href={routePath(`/docs/${f.first}`)} class="family-t">
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
          <Plate plate={PLATES.afterParts} />

          {/* What the kit meets on the reader's side. */}
          <WorksWith />
        </div>

        {/* The close: the install in a clear field inside a print of heat,
            the footer's own ramp (close.ts), its foot cut flat where the
            footer rises into it through one tab. */}
        <section
          id="install"
          ref={(el) => (closeBand = el)}
          aria-labelledby="install-h"
          class="close"
          style={{ "--reach": `${CLOSE.reach}px` }}
          onPointerMove={() => heat.drive()}
        >
          <HeatPrint paused={!heat.driven()} />
          <div class="sec install">
            <div ref={rise} class="install-head">
              <h2 id="install-h" class="section-title">
                <RiseWords text="Copy one folder. Every pixel is yours." />
              </h2>
              <p data-rise class="sec-lede">
                Copy the kit into your app, add its {RUNTIME_DEPS.length} packages and import from{" "}
                <code>@dither-kit</code>.{" "}
                <span class="lede-key">Or paste the agent prompt and your agent does all three.</span>
              </p>
              <DitherClipboard value={prompt()}>
                {(scope) => (
                  <button
                    type="button"
                    class="key prompt-key"
                    aria-label={scope.copied ? "Agent prompt copied" : undefined}
                  >
                    <DitherIcon name={scope.copied ? "Check" : "Copy"} size={12} strokeWidth={1.5} />
                    {scope.copied ? "Copied" : "Copy agent prompt"}
                  </button>
                )}
              </DitherClipboard>
            </div>
            <InstallBlock />
            <p class="install-note">
              On Svelte 5? The same kit ships as <code>dither-kit-svelte</code>, and the{" "}
              <a href={routePath("/docs/getting-started")} class="lead">
                quick start
              </a>{" "}
              has its steps.
            </p>
            <dl ref={rise} class="sheet" aria-label="The kit in brief">
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
      <footer class="foot" onPointerMove={() => drive()}>
        <div class="foot-art">
          <div aria-hidden="true" class="foot-ground">
            <Show when={mounted()}>
              <DitherShader
                source={ROAD_SHADER}
                colors={RAMP}
                seed={3}
                cell={ROAD.cell}
                dpr={1}
                interactive={false}
                paused={!driven() || !footStill()}
                label="Light trails"
              />
            </Show>
          </div>
          <div class="foot-in">
            <div class="foot-brand">
              <a href={routePath("/")} class="foot-name">
                <BrandGather class="foot-lockup" scene={STAGINGS.foot} onMoving={forming} onSettled={homed} />
                <span class="sr-only">dither-ui</span>
              </a>
              <p class="foot-line">
                A dithered UI toolkit, a Studio to play in and a skill for your agent. Printed one cell at a time.
              </p>
              <a href="https://github.com/drvova/dither-ui" target="_blank" rel="noreferrer" class="foot-gh">
                <ToolMark id="github" size={13} />
                GitHub<span class="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <For each={COLUMNS}>
              {(col) => (
                <nav class="foot-col" aria-label={col.title}>
                  <h2 class="foot-h">{col.title}</h2>
                  <For each={col.links}>{(l) => <a href={l.href}>{l.label}</a>}</For>
                </nav>
              )}
            </For>
          </div>
          <p class="foot-copy">
            <span>© {new Date().getFullYear()} dither-ui.com</span>
            <span>v{version}</span>
            <span>MIT license</span>
          </p>
          <div
            ref={(el) => (road = el)}
            class="foot-road"
            style={{ "--road": ROAD.aspect, "--road-narrow": ROAD.narrowAspect }}
          >
            <BrandMark
              size={84}
              class="road-mark"
              style={{ left: `${ROAD.mark[0] * 100}%`, bottom: `${ROAD.mark[1] * 100}%` }}
            />
            <div aria-hidden="true" class="foot-mark">
              <div class="mark-box">
                <LineWordmark />
                <div
                  ref={(el) => (car = el)}
                  class="road-car"
                  style={{ translate: `${carX()}px 0`, bottom: `${carBottom}%` }}
                >
                  <MascotCar size={56} driving={moving()} class="road-car-art" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
