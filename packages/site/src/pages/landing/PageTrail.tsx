// The pointer prints on the whole page's ground, every section's: pinned to
// the viewport, the print scrolling with the page. An island of the landing.
import { DitherHeatTrail } from "@dither-ui/kit"
import { TRAIL } from "@/pages/landing/plate"

export default function PageTrail() {
  return <DitherHeatTrail pinned class="page-trail" {...TRAIL} cell={4} />
}
