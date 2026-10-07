import { createApp } from "vue"
import App from "./App.vue"
import "./styles.css"

// Client render over the prerendered bytes: the routes' prerender exists for
// crawlers (see scripts/prerender.mjs), and hydrating it was attempted and
// abandoned — kit components gate on measured state (chart ctx.ready, mount
// flags), so first-render vnodes never match the settled snapshot and Vue's
// mismatch recovery corrupts section structure. Rendering fresh is correct
// and the deferred-route chunks below keep first paint unblocked.
createApp(App).mount("#app")
