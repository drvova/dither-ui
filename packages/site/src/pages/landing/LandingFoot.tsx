// The landing's footer: on the kit's art, the brand and a line beside three
// link columns, the copyright line and the road the trails sweep across,
// the line-screen wordmark printed over its foot. The ground dances by
// itself for `ROAD.dance` as the road comes into view, once the footer's
// brand is home, then moves only while the reader moves the page (a
// scroll, a pointer across the footer) and settles as they stop: under five
// seconds on its own, so it carries no pause. It holds while the brand
// forms (one moving layer at a time). An island of the landing: its art and
// the mascot's car are what a hand drives.
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"
import { STAGINGS } from "@/pages/landing/brand"
import { DOCS_FAMILIES } from "@/pages/landing/hub"
import { RAMP } from "@/pages/landing/plate"
import { ROAD, ROAD_SHADER, WORDMARK } from "@/pages/landing/road"
import { assetPath, routePath } from "@/shared/lib/routes"
import BrandMark from "@/shared/ui/BrandMark"
import MascotCar from "@/shared/ui/MascotCar"
import ToolMark from "@/shared/ui/ToolMark"
import { version } from "../../../package.json"
import BrandGather from "./BrandGather"
import LineWordmark from "./LineWordmark"
import { useDrive } from "./drive"
import { DitherShader } from "./parts"

// One row of the wordmark's screen below its ink's top: the first rows are
// hairlines, so the wheels stand where the letters read solid.
const carBottom = (1 - (WORDMARK.TOP + (WORDMARK.BASE - WORDMARK.TOP) / WORDMARK.ROWS) / WORDMARK.H) * 100

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

export default function LandingFoot() {
  const [mounted, setMounted] = createSignal(false)
  const [footStill, setFootStill] = createSignal(true)
  const { driven, drive, running } = useDrive()
  let road: HTMLDivElement | undefined
  // A scroll drives only what is on screen: the road off screen stays still
  // (driving it from anywhere ran the car's loop through the whole page).
  let roadNear = false
  const scrolled = () => roadNear && drive()
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
  // wordmark's box and comes back in at its left. Its travel is the
  // stylesheet's (`LandingPage.css`, `data-driving` running it).
  const moving = () => driven() && footStill()
  onMount(() => {
    setMounted(true)
    let seen: IntersectionObserver | null = null
    onCleanup(() => {
      removeEventListener("scroll", scrolled)
      seen?.disconnect()
    })
    addEventListener("scroll", scrolled, { passive: true })
    if (typeof IntersectionObserver === "undefined" || !road) return
    seen = new IntersectionObserver(
      (entries) => {
        const entry = latestEntry(entries)
        roadNear = !!entry?.isIntersecting
        inView = roadNear && (entry?.intersectionRatio ?? 0) >= 0.5
        if (inView) dance()
        else danced = false
      },
      { threshold: [0, 0.5] },
    )
    seen.observe(road)
  })

  return (
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
              <div class="road-car" data-driving={moving() ? "" : undefined} style={{ bottom: `${carBottom}%` }}>
                <MascotCar size={56} driving={moving()} class="road-car-art" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
