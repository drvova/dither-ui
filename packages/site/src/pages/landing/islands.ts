// The landing's islands: what a hand or the clock drives on the printed
// page, each its own chunk, woken as it nears the view (`shared/lib/island`).
// The rest of the page is its bytes: the headings, the copy, the links, the
// families and the spec sheet run no script.
import { islands, islandsReady } from "@/shared/lib/island"
import SpriteRoot from "@/shared/ui/SpriteRoot"

export const LANDING = islands(
  {
    /** The site's header: its menu, its hover ground. */
    header: { load: () => import("./LandingHeader") },
    /** The pointer's print on the page's ground. */
    trail: { load: () => import("./PageTrail"), when: "idle" },
    /** The hero: the poster, the brand gathering, the film's key. */
    hero: { load: () => import("./Showcase"), when: "load" },
    /** The bento of live components. */
    bento: { load: () => import("./Examples") },
    /** A plate of the brand between sections. */
    plate: { load: () => import("./Plate") },
    /** The brand raised by the world engine. */
    build: { load: () => import("./BrandBuild") },
    /** The agent session played as the page scrolls. */
    ask: { load: () => import("./AgentStory") },
    /** A What's-inside card's strip and character. */
    inside: { load: () => import("./InsideArt") },
    /** The close's print of heat. */
    heat: { load: () => import("./CloseHeat") },
    /** The agent prompt's copy key. */
    prompt: { load: () => import("./PromptKey"), when: "idle" },
    /** The install's steps and copy key. */
    install: { load: () => import("./InstallBlock") },
    /** The footer on the kit's art, the road and the car. */
    foot: { load: () => import("./LandingFoot") },
  },
  SpriteRoot,
)

if (import.meta.env.SSR) await islandsReady(LANDING)
