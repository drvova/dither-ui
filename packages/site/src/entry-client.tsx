// @refresh reload
import { mount, StartClient } from "@solidjs/start/client"
import { ditherViewTransition } from "@dither-ui/kit/engine/transition.ts"
import { pageTransitionOptions, takePageTransition } from "@/app/page-reveal"
import { sheetsReady } from "@/app/sheets-ready"
import { appPathname, isLanding, renderedAt, routePath } from "@/shared/lib/routes"
import { legacyAddress } from "@/shared/lib/legacy"
import { installHand } from "@/shared/lib/hand"
import { installPress } from "@/shared/lib/press"

// Arrived from another of the site's pages as a document of its own: dither
// from it to this one (the head's script parked the transition for us).
takePageTransition((arrival) => void ditherViewTransition(arrival, pageTransitionOptions()))

// What the reader presses gives under the hand and springs back: one
// listener for every page.
installPress()
// The hand the reader reaches with, so what opens under a finger raises no
// on-screen keyboard and rings nothing (`shared/lib/hand.ts`).
installHand()

// The page's bytes are taken over in place at the address they were
// rendered at, which SolidStart reads off its entry's script: a static
// host's trailing slash is the same address (`renderedAt`).
const entry = document.querySelector<HTMLScriptElement>("script[data-start-url]")
if (entry) entry.dataset.startUrl = renderedAt(entry.dataset.startUrl ?? "", location.pathname, location.search)

// An old hash link (`/#/docs/<id>`, `/#/studio/...`) leaves for the page it
// names, in place of the entry it came by; any other address mounts, once
// the page's stylesheets stand (this script runs async, ahead of them).
const legacy = isLanding(appPathname()) ? legacyAddress(location.hash) : null
if (legacy) location.replace(routePath(legacy))
else void sheetsReady().then(() => mount(() => <StartClient />, document.getElementById("app")!))
