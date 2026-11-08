import { createApp } from "vue"
import { ditherViewTransition } from "@dither-kit/engine/transition"
import App from "./App.vue"
import { appPathname, assetPath } from "@/shared/lib"
import { registerOffline } from "./offline"
import { pageTransitionOptions, takePageTransition } from "./page-reveal"
import { loadOpenPage } from "./route-pages"
import "./styles.css"

// Client render over the prerendered bytes: the routes' prerender exists for
// crawlers (see scripts/prerender.mjs), and hydrating it was attempted and
// abandoned — kit components gate on measured state (chart ctx.ready, mount
// flags), so first-render vnodes never match the settled snapshot and Vue's
// mismatch recovery corrupts section structure. Rendering fresh is correct,
// once the route's page has loaded (below).

// Arrived from another of the site's pages: dither from it to this one.
takePageTransition((arrival) => void ditherViewTransition(arrival, pageTransitionOptions()))

// The page the address opens on loads first: the prerendered bytes stay
// painted while it does, and the app mounts the same page over them in one
// step (mounting first left the page empty until the chunk came).
void loadOpenPage().finally(() => createApp(App).mount("#app"))

// The Studio is an app too: installed or not, it opens offline (`offline.ts`).
registerOffline(assetPath("/"), appPathname())
