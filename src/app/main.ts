import { createApp } from "vue"
import App from "./App.vue"
import "./styles.css"

// Client render over the prerendered bytes: the routes' prerender exists for
// crawlers (see scripts/prerender.mjs), and hydrating it was attempted and
// abandoned — kit components gate on measured state (chart ctx.ready, mount
// flags), so first-render vnodes never match the settled snapshot and Vue's
// mismatch recovery corrupts section structure. Rendering fresh is correct
// and the deferred-route chunks below keep first paint unblocked.

// WebKit (Safari on macOS/iOS — and every iOS browser, which is a WebKit
// skin) reveals `content-visibility: auto` subtrees with stale geometry until
// something forces a layout flush: blank chunks under real scroll (WebKit bug
// 321501, unfixed, found in Safari/iOS 26) plus scroll jank on re-entry
// (318216). The docs page opts its sections out of cv there through
// `html.engine-webkit`; Chrome/Gecko/Edge keep the win. Detect the ENGINE,
// not a brand — `AppleWebKit` without `Chrome`/`Android` — so CriOS/FxiOS/
// EdGiOS on iOS correctly count as WebKit. Drop this when those bugs land
// fixes.
const ua = navigator.userAgent
if (/AppleWebKit/.test(ua) && !/Chrome|Chromium|Android/.test(ua)) {
  document.documentElement.classList.add("engine-webkit")
}

createApp(App).mount("#app")
