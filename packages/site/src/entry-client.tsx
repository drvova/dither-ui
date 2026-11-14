// @refresh reload
import { mount, StartClient } from "@solidjs/start/client"
import { ditherViewTransition } from "@dither-ui/kit/engine/transition.ts"
import { pageTransitionOptions, takePageTransition } from "@/app/page-reveal"
import { appPathname, isLanding, routePath } from "@/shared/lib/routes"
import { legacyAddress } from "@/shared/lib/legacy"
import { installPress } from "@/shared/lib/press"

// Arrived from another of the site's pages as a document of its own: dither
// from it to this one (the head's script parked the transition for us).
takePageTransition((arrival) => void ditherViewTransition(arrival, pageTransitionOptions()))

// What the reader presses gives under the hand and springs back: one
// listener for every page.
installPress()

// An old hash link (`/#/docs/<id>`, `/#/studio/...`) leaves for the page it
// names, in place of the entry it came by; any other address mounts.
const legacy = isLanding(appPathname()) ? legacyAddress(location.hash) : null
if (legacy) location.replace(routePath(legacy))
else mount(() => <StartClient />, document.getElementById("app")!)
