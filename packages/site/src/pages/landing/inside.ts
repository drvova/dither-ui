// What's inside: the kit, the Studio and the bridge, each a card headed by a
// strip the kit prints in its own ink through its own printer's screen
// (blue in Bayer cells, the ember in lines, bone in a halftone dot): a tone
// for the kit and the Studio, a circuit board for the bridge, its signals
// running between the tab and the agent in the ember; its own
// character (the kit's seeded avatar of its title, in its ink) standing on
// the strip's foot, its name in the pixel face, two lines and its link. The
// card is the page's bytes; its strip and its character are an island
// (`InsideArt`), named by the card's `name`. Framework-free.
import type { PixelColor, ScreenKind } from "@dither-ui/kit/engine"
import { assetPath, routePath } from "@/shared/lib/routes"

export type InsideCard = {
  title: string
  name: "kit" | "studio" | "bridge"
  ink: PixelColor
  screen: ScreenKind
  /** What the strip prints: a tone from the ink, or a board in it. */
  art: "tone" | "circuit"
  text: string
  link: { label: string; href: string }
}

export const INSIDE: readonly InsideCard[] = [
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
