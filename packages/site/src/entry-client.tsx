// @refresh reload
import { mount, StartClient } from "@solidjs/start/client"
import { sheetsReady } from "@/app/sheets-ready"
import { appPathname, renderedAt, routePath } from "@/shared/lib/routes"
import { legacyAt } from "@/shared/lib/legacy"
import { installHand } from "@/shared/lib/hand"

// The page transition, the press and every motion of the site's own are
// its stylesheets' (`app/styles.css`): nothing here moves anything.
// The hand the reader reaches with, so what opens under a finger raises no
// on-screen keyboard and rings nothing (`shared/lib/hand.ts`).
installHand()

// The page's bytes are taken over in place at the address they were
// rendered at, which SolidStart reads off its entry's script: a static
// host's trailing slash is the same address (`renderedAt`).
const entry = document.querySelector<HTMLScriptElement>("script[data-start-url]")
if (entry) entry.dataset.startUrl = renderedAt(entry.dataset.startUrl ?? "", location.pathname, location.search)

// An old hash link (`/#/docs/<id>`, `/#/studio/...`, `/docs#/docs/<id>`)
// leaves for the page it names, in place of the entry it came by; any other
// address mounts, once the page's stylesheets stand (this script runs
// async, ahead of them).
const legacy = legacyAt(appPathname(), location.hash)
if (legacy) location.replace(routePath(legacy))
else void sheetsReady().then(() => mount(() => <StartClient />, document.getElementById("app")!))
