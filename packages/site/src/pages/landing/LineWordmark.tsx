// The footer's wordmark, printed as a line screen: "dither-ui" in the
// display face, filled by rows of ink that thicken toward the baseline (a
// vertical ramp through a screen of lines), flat, one ink, nothing that
// glows or moves. One SVG: the text is the clip and the rows are rects, so
// it scales with its box; `textLength` holds the word to the box's width
// whichever face has loaded. Under its rows the word is laid in the page's
// ground, so the art behind it passes behind the letters whole and never
// shows through between their rows.
import { createUniqueId, For } from "solid-js"
import { WORDMARK } from "@/pages/landing/road"
import "./LineWordmark.css"

const { W, H, TOP, BASE, ROWS } = WORDMARK
const PITCH = (BASE - TOP) / ROWS

// Each row's bar sits at the foot of its pitch, from 30% of it at the top
// to 92% at the baseline.
const rows = Array.from({ length: ROWS }, (_, i) => {
  const h = PITCH * (0.3 + (0.62 * i) / (ROWS - 1))
  return { y: TOP + (i + 1) * PITCH - h, h }
})

export default function LineWordmark() {
  const clip = createUniqueId()
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class="line-wordmark-scope line-wordmark"
      aria-hidden="true"
      {...{ focusable: "false" }}
    >
      <defs>
        <clipPath id={clip}>
          <text x="0" y={BASE} textLength={W} lengthAdjust="spacingAndGlyphs">
            dither-ui
          </text>
        </clipPath>
      </defs>
      <text class="ground" x="0" y={BASE} textLength={W} lengthAdjust="spacingAndGlyphs">
        dither-ui
      </text>
      <g clip-path={`url(#${clip})`}>
        <For each={rows}>{(r) => <rect x="0" y={r.y} width={W} height={r.h} />}</For>
      </g>
    </svg>
  )
}
