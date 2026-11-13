// The page transition's hand-off. A same-origin navigation between the
// site's pages is a view transition (styles.css opts in), and the new page
// receives it in `pagereveal`, which fires before its first frame, before
// the app's deferred script has run. So `PAGE_REVEAL_SCRIPT`, inlined at the
// top of every page's head (the shell, `entry-server.tsx`), parks the
// transition where `takePageTransition` finds it and holds the old page on
// screen; the client's entry then dithers it through the kit's transition engine. The hold lets go by
// itself if the app never comes. Arriving from one of the site's pages, the
// script also holds the first frame until the HTML is parsed to the
// `PAGE_END_ID` marker at the end of the body: Chromium drops the transition
// when it paints a page it is still parsing (the docs, 1.4 MB, did; 800 kB
// did not). No imports at runtime: the config loads this file under Node.

import type { DitherTransitionOptions } from "@dither-ui/kit"

const SLOT = "__ditherPageTransition"
/** The element at the end of every route's body. */
export const PAGE_END_ID = "page-end"
/** How long the old page may stay up waiting for the app. */
const WAIT_MS = 1500

export const PAGE_REVEAL_SCRIPT = `(function(){var a=window.navigation&&navigation.activation;if(!a||!a.from||a.navigationType==="reload")return;var l=document.createElement("link");l.rel="expect";l.href="#${PAGE_END_ID}";l.setAttribute("blocking","render");document.head.appendChild(l)})();addEventListener("pagereveal",function(e){var t=e.viewTransition;if(!t)return;window.${SLOT}=t;var s=document.createElement("style");s.textContent="::view-transition-old(root){animation:none}::view-transition-new(root){animation:dk-page-wait ${WAIT_MS}ms;mix-blend-mode:normal}@keyframes dk-page-wait{from,to{opacity:0}}";document.head.appendChild(s);function d(){s.remove()}t.finished.then(d,d)})`

/** Hand the navigation's transition to `take`, once: now if the page was
 * revealed before the app ran, else at the reveal (holding the first frame
 * to the end of the HTML lets the app's deferred script run first). */
export function takePageTransition(take: (transition: ViewTransition) => void): void {
  const slot = window as unknown as Record<string, ViewTransition | undefined>
  const parked = slot[SLOT]
  if (parked) {
    delete slot[SLOT]
    take(parked)
    return
  }
  addEventListener(
    "pagereveal",
    (e) => {
      const transition = (e as Event & { viewTransition?: ViewTransition | null }).viewTransition
      if (!transition) return
      delete slot[SLOT]
      take(transition)
    },
    { once: true },
  )
}

type Activation = { navigationType: string; entry?: { index: number }; from?: { index: number } | null }

/** Forward, the new page wipes in from the left through a band of the
 * signal ink; back through history, from the right, on the glide like
 * every motion on the site. */
export function pageTransitionOptions(): DitherTransitionOptions {
  const activation = (window as { navigation?: { activation?: Activation } }).navigation?.activation
  const back =
    activation?.navigationType === "traverse" && (activation.entry?.index ?? 0) < (activation.from?.index ?? 0)
  return {
    direction: back ? "left" : "right",
    ink: "var(--swatch-orange)",
    cell: 8,
    band: 12,
    duration: 640,
    easing: "glide",
  }
}

/** The site's speculation rules (Chromium; ignored elsewhere): a page of
 * the site the reader is about to open (a pointer resting on its link, or
 * pressing it) is made ready before the click, so the move lands at once.
 * The landing and the docs are rendered ahead; the Studio, an app, only
 * fetched; the share cards' renderer, the player and the kit's sources
 * never. `base` is the site's base path. */
export function speculationRules(base: string): string {
  const site = `${base}*`
  const never = ["og/*", "play/*", "kit/*", "studio*"].map((p) => ({ href_matches: `${base}${p}` }))
  return JSON.stringify({
    prerender: [{ where: { and: [{ href_matches: site }, { not: { or: never } }] }, eagerness: "moderate" }],
    prefetch: [{ where: { href_matches: `${base}studio*` }, eagerness: "moderate" }],
  })
}
