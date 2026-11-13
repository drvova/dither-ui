// The page an unknown address lands on, in the landing's print (its ground,
// its header, its keys): the mascot, lost but cheerful, a line that rises
// as the landing's do, why it happened, and the ways back. The pointer
// prints over the whole ground, so even a dead end answers the hand. It is
// never indexed: a crawler that follows a stale link keeps nothing.
import { Meta } from "@solidjs/meta"
import { onMount } from "solid-js"
import { DitherHeatTrail } from "dither-kit"
import "@/shared/fonts/display.css"
import "@/pages/landing/chapters.css"
import { TRAIL } from "@/pages/landing/plate"
import { rise, routePath } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot"
import { SiteHeader } from "@/widgets/site-header"
import RiseWords from "./RiseWords"
import "./MissingPage.css"

export default function MissingPage() {
  onMount(() => {
    // Always dark, as the landing is (see LandingPage).
    document.documentElement.classList.add("dark")
  })

  return (
    <div class="missing-page-scope landing flex min-h-dvh flex-col bg-background text-foreground antialiased">
      {/* Never indexed while it stands: the tag is the page's own, rendered
          with it, and goes with it. */}
      <Meta name="robots" content="noindex" />
      <SiteHeader current="landing" />
      <main id="main" tabindex="-1" class="lost outline-none">
        <DitherHeatTrail class="lost-trail" {...TRAIL} cell={4} />
        <div ref={rise} class="lost-in">
          <Mascot data-rise size={88} alive class="lost-mascot" />
          <h1 class="lost-h">
            <RiseWords text="This page did not print." />
          </h1>
          <p data-rise class="sec-lede">
            The link may be old, or the cell it pointed at was never there.{" "}
            <span class="lede-key">Everything else is where you left it.</span>
          </p>
          <div data-rise class="lost-keys">
            <a href={routePath("/")} class="nav-a key-chrome primary">
              Back to the start
            </a>
            <a href={routePath("/docs")} class="key">
              Read the docs
            </a>
            <a href={routePath("/studio")} class="key">
              Open the studio
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
