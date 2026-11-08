<script setup lang="ts">
// The page an unknown address lands on, in the landing's print (its ground,
// its header, its keys): the mascot, lost but cheerful, a line that rises
// as the landing's do, why it happened, and the ways back. The pointer
// prints over the whole ground, so even a dead end answers the hand. It is
// never indexed: a crawler that follows a stale link keeps nothing.
import { onBeforeUnmount, onMounted } from "vue"
import { DitherHeatTrail } from "@dither-kit"
import { routePath, vRise } from "@/shared/lib"
import Mascot from "@/shared/ui/Mascot.vue"
import { SiteHeader } from "@/widgets/site-header"
import "@/shared/fonts/display.css"
import "./chapters.css"
import { TRAIL } from "./plate"
import RiseWords from "./RiseWords.vue"

// The shell it is served in says index, follow: turn that tag (or a new
// one) to noindex while this page stands, and give it back after.
let robots: HTMLMetaElement | null = null
let was: string | null = null
onMounted(() => {
  // Always dark, as the landing is (see LandingPage).
  document.documentElement.classList.add("dark")
  robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (robots) was = robots.content
  else {
    robots = document.createElement("meta")
    robots.name = "robots"
    document.head.append(robots)
  }
  robots.content = "noindex"
})
onBeforeUnmount(() => {
  if (was === null) robots?.remove()
  else if (robots) robots.content = was
})
</script>

<template>
  <div class="landing flex min-h-dvh flex-col bg-background text-foreground antialiased">
    <SiteHeader current="landing" />
    <main id="main" tabindex="-1" class="lost outline-none">
      <DitherHeatTrail class="lost-trail" v-bind="TRAIL" :cell="4" />
      <div v-rise class="lost-in">
        <Mascot data-rise :size="88" alive class="lost-mascot" />
        <h1 class="lost-h"><RiseWords text="This page did not print." /></h1>
        <p data-rise class="sec-lede">
          The link may be old, or the cell it pointed at was never there.
          <span class="lede-key">Everything else is where you left it.</span>
        </p>
        <div data-rise class="lost-keys">
          <a :href="routePath('/')" class="nav-a key-chrome primary">Back to the start</a>
          <a :href="routePath('/docs')" class="key">Read the docs</a>
          <a :href="routePath('/studio')" class="key">Open the studio</a>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* One screen under the header, the copy centred on the page's ground,
   where the pointer prints under everything. */
.lost {
  position: relative;
  isolation: isolate;
  display: grid;
  flex: 1;
  place-items: center;
  padding: 48px 24px 96px;
}

.lost-trail {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.lost-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 34rem;
  text-align: center;
}

.lost-mascot {
  color: var(--ink);
}

.lost-h {
  margin: 0;
  font-family: var(--display-face);
  font-size: clamp(1.8rem, 4.2vw, 3rem);
  font-weight: 400;
  line-height: 1.1;
  text-wrap: balance;
  color: var(--ink);
}

.lost-keys {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}
</style>
