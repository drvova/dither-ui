import { createApp } from "vue"
import { ditherViewTransition } from "@dither-kit/engine/transition"
import App from "./App.vue"
import { pageTransitionOptions, takePageTransition } from "./page-reveal"
import "./styles.css"

// Client render over the prerendered bytes: the routes' prerender exists for
// crawlers (see scripts/prerender.mjs), and hydrating it was attempted and
// abandoned — kit components gate on measured state (chart ctx.ready, mount
// flags), so first-render vnodes never match the settled snapshot and Vue's
// mismatch recovery corrupts section structure. Rendering fresh is correct
// and the deferred-route chunks below keep first paint unblocked.

// Arrived from another of the site's pages: dither from it to this one.
takePageTransition((arrival) => void ditherViewTransition(arrival, pageTransitionOptions()))

createApp(App).mount("#app")
