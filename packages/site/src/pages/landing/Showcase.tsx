import { createSignal, For } from "solid-js"
import { DitherIcon, DitherPoster, DitherReveal } from "@dither-ui/kit"
import { STAGINGS } from "@/pages/landing/brand"
import { COMPONENT_COUNT, MATRIX, WORKS } from "@/pages/landing/facts"
import { INKS } from "@/pages/landing/plate"
import { SCENES } from "@/pages/landing/scenes"
import { rise, routePath } from "@/shared/lib"
import { scene } from "@/shared/lib/scroll-scene-ref"
import ToolMark from "@/shared/ui/ToolMark"
import BrandGather from "./BrandGather"
import RiseWords from "./RiseWords"
import TrailerDialog from "./TrailerDialog"
import { useDrive } from "./drive"
import "./Showcase.css"

// The print moves on cue (the industrial brief: no perpetual loops): its
// screen slides for `HERO_RUN` once the brand is home, then only while a
// pointer moves over it. Under five seconds by itself, so no pause key.
const HERO_RUN = 4000

// The hero, our own: the first screen tall, the statement beside a print
// the kit makes (a live DitherPoster: the palette as tone, the kit's
// diamond knocked out of it, its screen sliding inside the mark), on the
// obsidian like a print on black stock. The film is a key away. As the page
// leaves it the hero eases back in step with the scroll (`SCENES.hero`):
// the statement recedes and fades, the print drifts down behind it.
export default function Showcase() {
  const [film, setFilm] = createSignal(false)

  // The statement signs off with the brand (`STAGINGS.hero`), gathering out
  // of the open field of the page's column under it (some of its cells from
  // under the print) as the page opens, and again under a resting mouse. One
  // moving layer at a time: the print holds its frame until the brand is home.
  const [gathered, setGathered] = createSignal(false)

  const { driven, drive } = useDrive()
  function settled() {
    setGathered(true)
    drive(HERO_RUN)
  }
  const held = () => !driven() || !gathered()

  return (
    <section ref={scene(SCENES.hero)} aria-labelledby="hero-h" class="showcase-scope hero">
      <div class="hero-in">
        {/* The statement rises as the page opens: the headline word by word,
            then the lede, the keys and what it works with. */}
        <div ref={rise} class="statement">
          <h1 id="hero-h" class="hero-h">
            <RiseWords text="A dithered UI toolkit for Solid." word="chrome-type" />
          </h1>
          <p data-rise class="hero-lede">
            {COMPONENT_COUNT} components, from charts and controls to GLSL and 3D, each printed cell by cell through one
            seeded {MATRIX} matrix. Copy the folder into your Solid app and change what you need.
          </p>
          <div data-rise class="hero-keys">
            <a href={routePath("/studio")} class="nav-a key-chrome primary">
              Open the studio
            </a>
            <a href={routePath("/docs")} class="key">
              Read the docs
            </a>
            <button type="button" class="key" onClick={() => setFilm(true)}>
              <DitherIcon name="Play" size={12} strokeWidth={1.5} />
              Watch the film
            </button>
          </div>
          <div data-rise class="works">
            <span id="works-l">Works with</span>
            <ul aria-labelledby="works-l">
              <For each={WORKS}>
                {(t) => (
                  <li>
                    <ToolMark id={t.id} size={13} />
                    {t.name}
                  </li>
                )}
              </For>
            </ul>
          </div>
          <BrandGather
            class="hero-brand"
            scene={STAGINGS.hero}
            replay
            onMoving={() => setGathered(false)}
            onSettled={settled}
          />
        </div>
        <div class="print-col">
          <div class="print" onPointerMove={() => gathered() && drive()}>
            <DitherPoster seed={5} inks={INKS} cell={4} speed={1.5} paused={held()} />
            {/* The print stands over its own reflection on the obsidian: the
                same print at the same moment, turned over and thinned through
                the kit's wipe to two-fifths, then a fifth, of its cells. A
                shadow cannot show on black; a floor of the print's own cells
                can, and it is never a tint. (The poster inside is hidden from
                assistive technology by itself.) */}
            <DitherReveal class="print-floor" progress={1 / 3} direction="down" band={20} aria-hidden="true">
              <DitherPoster seed={5} inks={INKS} cell={4} speed={1.5} paused={held()} class="print-mirror" />
            </DitherReveal>
          </div>
        </div>
      </div>
      <TrailerDialog modelValue={film()} onUpdateModelValue={setFilm} />
    </section>
  )
}
