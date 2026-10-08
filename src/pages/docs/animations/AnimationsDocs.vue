<script setup lang="ts">
import { computed, ref } from "vue"
import {
  DitherAnimatedContent,
  DitherAurora,
  DitherBlobCursor,
  DitherClickSpark,
  DitherCrosshair,
  DitherContainer,
  DitherLayer,
  DitherStage,
  DitherElectricBorder,
  DitherFadeContent,
  DitherGhostCursor,
  DitherGlareHover,
  DitherGradualBlur,
  DitherImageTrail,
  DitherMagnet,
  DitherPixelTrail,
  DitherSplashCursor,
  DitherStarBorder,
  DitherTargetCursor,
  DitherMetaBalls,
  DitherMetallicPaint,
  DitherNoise,
  DitherCubes,
  DitherRibbons,
  DitherSequence,
  DitherShapeBlur,
  DitherStrands,
  DitherLaserFlow,
  DitherAntigravity,
  DitherLogoLoop,
  DitherMagicRings,
  DitherMagnetLines,
  DitherOrbitImages,
  DitherPixelTransition,
  DitherReveal,
  DitherStickerPeel,
  DitherExpandTabs,
  DitherIsland,
  DitherCardStack,
  DitherDock,
  DitherPreviewRail,
  DitherScrollProgress,
  DitherSnapButton,
  DitherGooeyMenu,
  DitherBouncyAccordion,
  DitherExpandingArrow,
  DitherSlideAction,
  DitherHoldAction,
  DitherWalletCard,
  DitherNotificationStack,
} from "@dither-kit"
import { linear, quantize, steps } from "@dither-kit"
import type { StaggerFrom } from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const SHARED_CANVAS: PropRow[] = [
  { prop: "opacity", type: "number (0-1)", default: "1" },
  { prop: "dither", type: "number (0-1) | boolean", default: "1" },
  { prop: "paused", type: "boolean", default: "false" },
  { prop: "mix-blend-mode", type: "string", default: "undefined" },
  { prop: "seed", type: "number", default: "undefined" },
]

const API: Record<string, PropRow[]> = {
  stepTiming: [
    { prop: "steps(n, position?)", type: "(p) => number — css-easing-1 step positions", default: '"jump-end"' },
    { prop: "frameSteps(fps, durationMs)", type: "(p) => number — frame(fps) cadence polyfill", default: "—" },
    { prop: "frameIndex(elapsedMs, fps)", type: "number — wall-clock frame gate for drivers", default: "—" },
    { prop: "cssSteps(n, position?)", type: "string — one config serialized for CSS", default: '"jump-end"' },
    { prop: "DitherAurora frame-rate", type: "number (fps)", default: "0 (smooth)" },
  ],
  stage: [
    { prop: "duration", type: "number (s) — the stage clock loops over it; unset, time runs on", default: "—" },
    { prop: "speed", type: "number — clock multiplier", default: "1" },
    { prop: "paused / frameRate", type: "boolean / number (fps, 0 = smooth)", default: "false / 0" },
    { prop: "restartKey", type: "unknown — change to restart from 0", default: "—" },
    { prop: "as / class", type: "element tag / passthrough class — give the stage a height: it is a size query container", default: '"div" / —' },
    { prop: "slot props", type: "{ time, width, height } — the moment and the measured content box", default: "—" },
    { prop: "data-stage / --cq-w / --cq-h", type: "playing | directed | paused | still, and the box for CSS", default: "—" },
  ],
  layer: [
    { prop: "keyframes", type: "Keyframe[] — { at? (s or '50%'), easing?, x, y (lengths: px, %, cqw, cqh, cqi, cqb, cqmin, cqmax, vw…, calc()), rotate, skewX, skewY (angles), scale, scaleX, scaleY, opacity, ...custom numbers or lengths }", default: "[]" },
    { prop: "duration", type: "number (s) — unset, the last key's at in seconds, else 1", default: "—" },
    { prop: "delay / loop / yoyo", type: "number (s) / number | true / boolean", default: "0 / 1 / false" },
    { prop: "easing", type: "'linear' | 'ease-out' | 'ease-in-out' | bezier points | seed | Easing — between keys; a key's own easing wins for the segment it starts", default: "linear" },
    { prop: "origin", type: "string — transform-origin, container units welcome", default: '"50% 50%"' },
    { prop: "as / class", type: "element tag / class (the layer is absolute, inset 0)", default: '"div" / —' },
    { prop: "slot props", type: "every property resolved to px / degrees against the stage box, plus progress, state, cycle, time, width, height", default: "—" },
    { prop: "style / data-layer", type: "transform in the keyframes' own units, opacity, --layer-p and --layer-<name> per property; before | active | done", default: "—" },
    { prop: "sampleKeyframes(track, t) · keyframeTransform(sample, box?) · resolveSample(sample, box) · parseLength / termsToCss / termsToPx", type: "the engine alone, for your own painters and timelines", default: "—" },
  ],
  sequences: [
    { prop: "stagger", type: "number — seconds between neighbouring children", default: "0.06" },
    { prop: "from", type: '"start" | "center" | "end" | "edges" | literal index', default: '"start"' },
    { prop: "duration / easing", type: "number (s per cycle) / (p) => number from timing.ts", default: '0.5 / linear' },
    { prop: "loop / yoyo / delay", type: "number / boolean / seconds before the timeline", default: "1 / false / 0" },
    { prop: "paused / restartOnView / frameRate", type: "boolean / boolean / fps cadence", default: "false / false / 0" },
    { prop: "restartKey / onComplete", type: "string | number — bump rebuilds and replays / () => void", default: "—" },
    { prop: "planSequence(node | node[])", type: "SequencePlan — flatten serial | parallel | stagger | track once", default: "—" },
    { prop: "sampleSequence(plan, t)", type: "TrackSample[] — { id, index, progress, raw, cycle, state }", default: "—" },
    { prop: "staggerDelay(i, count, each, from)", type: "number — the delay wave, testable alone", default: "—" },
  ],
  containerQueries: [
    { prop: "scale", type: "CqScale — Record<name, min | { min?, max? }>; min inclusive, max exclusive, order irrelevant", default: "CONTAINER_SCALE (xs 0 · sm 240 · md 360 · lg 520 · xl 720)" },
    { prop: "step", type: "number — quantize --cq-w to this px (0 = continuous)", default: "0" },
    { prop: "name", type: "string — native container-name for children's @container rules", default: '"dither"' },
    { prop: "as / class", type: "element tag / passthrough class", default: '"div" / —' },
    { prop: "slot props", type: "{ width, height, size, index, matches } — measured content box (what @container sees), active bucket, its ordinal, every matching bucket", default: "—" },
    { prop: "resolveCq(width, scale?)", type: "CqState — the pure resolver (active = highest matching min)", default: "CONTAINER_SCALE" },
    { prop: "quantize(value, step)", type: "number — nearest step, never negative; step ≤ 0 is identity", default: "—" },
    { prop: "data-cq / --cq-w / --cq-h / --cq-i", type: "active bucket attribute + content-box width/height (raw or quantized together) + ordinal, published on the host for CSS", default: "—" },
    { prop: "dither-cq-traverse / dither-cq-rise", type: "shipped @keyframes — translateX(±100cqw) / translateY(±100cqh); motion measured against the container (small-viewport fallback when none)", default: "—" },
  ],
  expandTabs: [
    { prop: "tabs", type: "{ value, label, color? }[]", default: "required" },
    { prop: "modelValue", type: "string (v-model)", default: "required" },
    { prop: "color", type: "PixelColor — active glyph fallback", default: '"blue"' },
  ],
  island: [
    { prop: "modelValue", type: "boolean (v-model) — expanded", default: "false" },
    { prop: "label", type: "string — compact row text", default: '"Status"' },
    { prop: "color", type: "PixelColor — status dot", default: '"green"' },
    { prop: "live", type: "boolean — pulse the dot while collapsed", default: "true" },
    { prop: "slots", type: "compact · default (detail panel)", default: "—" },
  ],
  cardStack: [
    { prop: "items", type: "T[] — cycled forever", default: "required" },
    { prop: "depth", type: "number — visible under-cards", default: "2" },
    { prop: "default slot", type: "scoped: { item, index, top }", default: "card face fallback" },
    { prop: "@advance", type: "(index) — after a card flies out", default: "—" },
  ],
  dock: [
    { prop: "items", type: "{ value, label, color? }[]", default: "required" },
    { prop: "magnify", type: "number — peak scale over the pointer", default: "1.7" },
    { prop: "range", type: "number (px) — gaussian falloff radius", default: "80" },
    { prop: "@select", type: "(value)", default: "—" },
  ],
  previewRail: [
    { prop: "items", type: "{ value, label, hint?, color? }[]", default: "required" },
    { prop: "modelValue", type: "string (v-model) — active destination", default: "undefined" },
    { prop: "range", type: "number (px) — pyramid falloff radius", default: "56" },
    { prop: "side", type: '"left" | "right" — edge the rail hugs', default: '"left"' },
    { prop: "preview slot", type: "scoped: { item } — custom preview content", default: "label + hint" },
  ],
  scrollProgress: [
    { prop: "attach", type: '"viewport" | "parent"', default: '"viewport"' },
    { prop: "edge", type: '"top" | "bottom"', default: '"top"' },
    { prop: "color", type: "PixelColor", default: '"green"' },
  ],
  snapButton: [
    { prop: "threshold", type: "number (px) — displacement that arms the snap", default: "64" },
    { prop: "axis", type: '"x" | "y" | "both"', default: '"x"' },
    { prop: "color", type: "PixelColor — armed accent", default: '"green"' },
    { prop: "@snap", type: "() — armed release, or Enter/Space", default: "—" },
    { prop: "default slot", type: "label content", default: '"Pull to confirm"' },
  ],
  gooeyMenu: [
    { prop: "items", type: "{ value, label, color? }[]", default: "required" },
    { prop: "modelValue", type: "boolean (v-model) — expanded", default: "false" },
    { prop: "direction", type: '"up" | "down" | "left" | "right"', default: '"up"' },
    { prop: "spacing", type: "number (px) — gap between item centers", default: "52" },
    { prop: "@select", type: "(value) — also collapses", default: "—" },
  ],
  bouncyAccordion: [
    { prop: "items", type: "{ value, label, hint?, icon?, color?, content? }[]", default: "required" },
    { prop: "modelValue", type: "string (v-model) — open item, \"\" closes all", default: '""' },
    { prop: "color", type: "PixelColor — icon fallback tint", default: '"blue"' },
    { prop: "item slots", type: "#<value> — rich panel content (else item.content)", default: "—" },
  ],
  expandingArrow: [
    { prop: "color", type: "PixelColor — tile and trail accent", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "default slot", type: "label content", default: '"Explore the kit"' },
  ],
  slideAction: [
    { prop: "label", type: "string — track text and thumb aria-label", default: '"Slide to confirm"' },
    { prop: "color", type: "PixelColor — thumb accent", default: '"green"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "@confirm", type: "() — thumb reached the end, or Enter/Space", default: "—" },
  ],
  holdAction: [
    { prop: "duration", type: "number (ms) — hold time to complete", default: "1200" },
    { prop: "direction", type: '"vertical" | "horizontal" — fill axis', default: '"vertical"' },
    { prop: "color", type: "PixelColor — fill and crest accent", default: '"orange"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "@complete", type: "() — fill reached full; once per hold", default: "—" },
  ],
  walletCard: [
    { prop: "accounts", type: "{ value, label, address, balance, change?, color? }[]", default: "required" },
    { prop: "modelValue", type: "string (v-model) — selected account", default: "first account" },
    { prop: "balance / change", type: "number — override the active account's numbers", default: "account data" },
    { prop: "currency", type: "string — balance prefix", default: '"$"' },
    { prop: "defaultHidden", type: "boolean — start masked", default: "false" },
    { prop: "searchPlaceholder", type: "string", default: '"Search…"' },
    { prop: "recent", type: "string[] — recent queries in the search panel", default: "undefined" },
    { prop: "notifications", type: "boolean — unread pulse on the bell", default: "false" },
    { prop: "color", type: "PixelColor — card accent", default: '"green"' },
    { prop: "@action", type: '("send" | "deposit" | "swap" | "buy")', default: "—" },
    { prop: "@search", type: "(query) — live text on every keystroke", default: "—" },
    { prop: "@submit", type: "(query) — Enter or a recent row", default: "—" },
    { prop: "@notify", type: "() — bell pressed", default: "—" }
  ],
  notificationStack: [
    { prop: "items", type: "{ id, title, body?, time?, icon?, color? }[]", default: "required" },
    { prop: "modelValue", type: "boolean (v-model) — pinned open; hover/focus expand transiently", default: "false" },
    { prop: "maxVisible", type: "number — cards shown in the stack and list", default: "3" },
    { prop: "collapsedLabel", type: "string — header + toggle aria-label", default: '"Notifications"' },
    { prop: "expandedLabel", type: "string — view-all button text", default: '"View all"' },
    { prop: "emptyLabel", type: "string — empty-state card", default: '"All caught up"' },
    { prop: "variant", type: '"stack" | "fan" | "condensed" — collapsed silhouette', default: '"stack"' },
    { prop: "color", type: "PixelColor — icon fallback tint", default: '"blue"' },
    { prop: "@viewall", type: "() — view-all pressed", default: "—" },
  ],
  animatedContent: [
    { prop: "distance", type: "number (px) | CSS length — \"4cqw\" rides the nearest query container", default: "40" },
    { prop: "direction", type: '"vertical" | "horizontal"', default: '"vertical"' },
    { prop: "reverse", type: "boolean", default: "false" },
    { prop: "duration", type: "number (ms)", default: "800" },
    { prop: "delay", type: "number (ms)", default: "0" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  fadeContent: [
    { prop: "duration", type: "number (ms)", default: "1000" },
    { prop: "delay", type: "number (ms)", default: "0" },
    { prop: "blur", type: "boolean", default: "false" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  gradualBlur: [
    { prop: "position", type: '"bottom" | "top"', default: '"bottom"' },
    { prop: "height", type: "number (px)", default: "96" },
    { prop: "strength", type: "number (px)", default: "4" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  starBorder: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "speed", type: "number (s)", default: "6" },
    { prop: "thickness", type: "number (px)", default: "1" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  electricBorder: [
    { prop: "color", type: "string (hex)", default: '"#5227FF"' },
    { prop: "speed", type: "number", default: "1" },
    { prop: "thickness", type: "number (px)", default: "2" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  glareHover: [{ prop: "default slot", type: "content", default: "—" }],
  magnet: [
    { prop: "strength", type: "number (0-1)", default: "0.4" },
    { prop: "radius", type: "number (px)", default: "200" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  clickSpark: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "count", type: "number", default: "8" },
    { prop: "size", type: "number (px)", default: "16" },
    { prop: "duration", type: "number (ms)", default: "420" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  blobCursor: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "size", type: "number (px)", default: "48" },
    { prop: "lag", type: "number (0-1)", default: "0.18" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  crosshair: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "thickness", type: "number (px)", default: "1" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  ghostCursor: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "count", type: "number", default: "18" },
    { prop: "size", type: "number (px)", default: "10" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  splashCursor: [
    { prop: "color", type: "string (hex)", default: '"#3DA5FF"' },
    { prop: "max-radius", type: "number (px)", default: "60" },
    { prop: "duration", type: "number (ms)", default: "700" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  targetCursor: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "size", type: "number (px)", default: "36" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  pixelTrail: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "gap", type: "number (px)", default: "24" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  imageTrail: [
    { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', ...]" },
    { prop: "size", type: "number (px)", default: "40" },
    { prop: "duration", type: "number (ms)", default: "650" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  metaBalls: [
    { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', '#3DA5FF']" },
    { prop: "count", type: "number", default: "6" },
    { prop: "speed", type: "number", default: "1" },
    { prop: "ball-size", type: "number", default: "1" },
    { prop: "glow", type: "number", default: "1.5" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  metallicPaint: [
    { prop: "colors", type: "string[] (hex)", default: "['#1A1A22', '#8890A0', '#E8ECF4']" },
    { prop: "scale", type: "number", default: "3" },
    { prop: "speed", type: "number", default: "0.4" },
    { prop: "distortion", type: "number", default: "0.6" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  noise: [
    { prop: "colors", type: "string[] (hex)", default: "['#3DA5FF', '#7CE0FF', '#FFFFFF']" },
    { prop: "speed", type: "number", default: "1" },
    { prop: "density", type: "number (0-1)", default: "0.5" },
    { prop: "opacity", type: "number (0-1)", default: "1" },
    { prop: "paused", type: "boolean", default: "false" },
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  cubes: [
    { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', '#CFFFDF']" },
    { prop: "scale", type: "number", default: "6" },
    { prop: "speed", type: "number", default: "0.4" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  ribbons: [
    { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67', '#3DA5FF']" },
    { prop: "count", type: "number", default: "5" },
    { prop: "thickness", type: "number", default: "0.12" },
    { prop: "amplitude", type: "number", default: "1" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  shapeBlur: [
    { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CFF67']" },
    { prop: "size", type: "number", default: "0.4" },
    { prop: "softness", type: "number", default: "0.3" },
    { prop: "mouse-interaction", type: "boolean", default: "true" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  strands: [
    { prop: "colors", type: "string[] (hex)", default: "['#5227FF', '#7CE0FF']" },
    { prop: "count", type: "number", default: "40" },
    { prop: "sway", type: "number", default: "0.15" },
    { prop: "line-width", type: "number", default: "0.01" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  laserFlow: [
    { prop: "colors", type: "string[] (hex)", default: "['#FF3D2E', '#FFD23D', '#FFFFFF']" },
    { prop: "count", type: "number", default: "4" },
    { prop: "beam-width", type: "number", default: "0.02" },
    { prop: "glow", type: "number", default: "1" },
    ...SHARED_CANVAS,
    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },
  ],
  antigravity: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "count", type: "number", default: "40" },
    { prop: "speed", type: "number", default: "1" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  logoLoop: [
    { prop: "items", type: "string[]", default: "['DITHER', 'BAYER', ...]" },
    { prop: "speed", type: "number (s)", default: "18" },
    { prop: "gap", type: "number (px)", default: "48" },
  ],
  magicRings: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "count", type: "number", default: "4" },
    { prop: "duration", type: "number (s)", default: "3" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  magnetLines: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "gap", type: "number (px)", default: "28" },
    { prop: "line-length", type: "number (px)", default: "14" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  orbitImages: [
    { prop: "items", type: "string[]", default: "['A', 'B', 'C', 'D', 'E']" },
    { prop: "radius", type: "number (px)", default: "80" },
    { prop: "duration", type: "number (s)", default: "16" },
    { prop: "size", type: "number (px)", default: "200" },
  ],
  pixelTransition: [
    { prop: "rows", type: "number", default: "6" },
    { prop: "cols", type: "number", default: "10" },
    { prop: "color", type: "string (hex)", default: '"#111318"' },
    { prop: "default slot", type: "content", default: "—" },
  ],
  ditherReveal: [
    { prop: "progress", type: "number 0–1 (manual; unset plays on the clock)", default: "—" },
    { prop: "duration", type: "number (s)", default: "1.2" },
    { prop: "delay", type: "number (s)", default: "0" },
    { prop: "direction", type: "'none' | 'right' | 'left' | 'down' | 'up'", default: "'none' (dissolve)" },
    { prop: "cell", type: "number (px)", default: "4" },
    { prop: "band", type: "number (cells; directional wipes)", default: "12" },
    { prop: "seed", type: "number (a seeded 4×4 matrix)", default: "— (Bayer 8×8)" },
    { prop: "reverse", type: "boolean (hide instead)", default: "false" },
    { prop: "easing", type: "EasingInput", default: "'ease-in-out'" },
    { prop: "restartKey", type: "unknown (change to replay)", default: "—" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  stickerPeel: [{ prop: "default slot", type: "content", default: "—" }],
}

const SNIPPETS = {
  stepTiming: `import { steps, frameSteps, frameIndex, cssSteps } from "@dither-kit"

// easing-level: progress in, quantized progress out — the four positions are
// spec-locked to css-easing-1 (jump-end | jump-start | jump-none | jump-both)
const lattice6 = steps(6, "jump-none")   // displays both 0 and 1 — meters
const retro = frameSteps(24, 2400)       // 24fps cadence derived from duration

// one config → the CSS surface, so JS and CSS can never disagree
el.style.animationTimingFunction = cssSteps(6, "jump-none") // "steps(6, jump-none)"

// driver-level: hold the raster between wall-time frame boundaries
const idx = frameIndex(elapsedMs, 12)    // same idx → skip the paint entirely`,
  stepTimingAurora: `<!-- the field driver's own knob: stop-motion and fewer uploads -->
<DitherAurora />                          <!-- smooth, ~30fps paint throttle -->
<DitherAurora :frame-rate="8" />          <!-- film: paints 8×/s, holds between -->`,
  sequences: `import { DitherSequence, planSequence, sampleSequence, steps } from "@dither-kit"

<!-- declarative: children wave in from the center, ping-pong x3, quantized -->
<DitherSequence
  :stagger="0.07" from="center" :duration="0.6"
  :loop="3" yoyo :easing="steps(4)"
  :restart-key="key" :on-complete="done"
  class="grid grid-cols-6 gap-2"
>
  <div v-for="i in 12" :key="i" class="cell" />
</DitherSequence>
// children style themselves:  opacity: var(--seq-p, 0)
// the driver writes that var + data-seq="before|active|done" per child

// imperative: the same algebra under your own clock
const plan = planSequence({
  kind: "stagger", count: 12, stagger: 0.07, from: "center",
  node: (i) => ({ kind: "track", id: String(i), duration: 0.6, loop: 3, yoyo: true }),
})
const samples = sampleSequence(plan, t) // [{ id, index, progress, state }, ...]`,
  stage: `<DitherStage :duration="8" class="h-56">
  <DitherLayer :keyframes="[{ x: '-6cqw' }, { x: '6cqw' }]" :duration="8" yoyo loop>
    <DitherAurora class="h-full" />           <!-- a canvas layer drifts 12% of the stage, at any size -->
  </DitherLayer>
  <DitherLayer :keyframes="[{ x: 0 }, { x: '-24cqw' }]" :duration="8" yoyo loop>
    <svg viewBox="0 0 120 40" preserveAspectRatio="none"><path d="…" /></svg>   <!-- SVG parallax -->
  </DitherLayer>
  <DitherLayer
    :keyframes="[
      { at: 0, x: '80cqw', y: '12cqh', rotate: 0 },
      { at: '50%', easing: 'ease-in-out', rotate: '0.5turn' },
      { x: '20cqw', y: '8cqh', rotate: '1turn' },
    ]"
    :duration="8" loop origin="0 0"
  >
    <svg …moon… />
  </DitherLayer>
  <DitherLayer v-slot="{ cx, cy }" :keyframes="[{ cx: '10cqw', cy: '70cqh' }, { cx: '90cqw', cy: '40cqh' }]" :duration="4" yoyo loop>
    <svg :viewBox="…"><circle :cx="cx" :cy="cy" r="4" /></svg>   <!-- the same keys, resolved to px for painters -->
  </DitherLayer>
</DitherStage>

// the engine alone
import { sampleKeyframes, keyframeTransform, resolveSample } from "@dither-kit"
const s = sampleKeyframes({ keyframes: [{ x: "10px" }, { x: "50cqw" }], duration: 2 }, 1)
keyframeTransform(s)                               // "translate(calc(5px + 25cqw), 0px)"
resolveSample(s, { width: 400, height: 200 }).x    // 105`,
  containerQueries: `import { DitherContainer, quantize } from "@dither-kit"

<!-- children read THIS box's width — not the viewport's -->
<DitherContainer
  v-slot="{ width, size, index }"
  :scale="{ xs: 0, sm: 260, md: 360, lg: 450, xl: 530 }"
  :step="8"
  name="card"
  class="cq-card"
>
  <span class="readout">{{ size }} · {{ width }}px · q8 {{ quantize(width, 8) }}</span>
  <DitherSequence
    :stagger="0.03 + index * 0.02"
    :from="index >= 3 ? 'center' : 'start'"
    :restart-key="size"
    class="cq-grid"
  >
    <div v-for="i in 12" :key="i" class="cell" />
  </DitherSequence>
</DitherContainer>

/* stylesheet route — the same scope with zero JS: native @container */
@container card (min-width: 520px) {
  .readout { letter-spacing: 0.12em; }
}
/* motion route — shipped keyframes measure the container itself */
.scan { animation: dither-cq-traverse 2.8s ease-in-out infinite alternate; }
/* selector route — the engine's active bucket rides the host element */
.cq-card[data-cq="xs"] .cell { border-color: #d9a441; }
.cq-card[data-cq="xl"] .cell { border-color: #3f8ff3; }`,
  animatedContent: `<DitherAnimatedContent :distance="40" direction="vertical">
  <YourCard />
</DitherAnimatedContent>`,
  fadeContent: `<DitherFadeContent :blur="true">
  <YourCard />
</DitherFadeContent>`,
  gradualBlur: `<DitherGradualBlur position="bottom" :height="96">
  <ScrollingList />
</DitherGradualBlur>`,
  starBorder: `<DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>`,
  electricBorder: `<DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>`,
  glareHover: `<DitherGlareHover><YourCard /></DitherGlareHover>`,
  magnet: `<DitherMagnet :strength="0.4"><button>Magnet</button></DitherMagnet>`,
  clickSpark: `<DitherClickSpark color="#7CFF67"><YourArea /></DitherClickSpark>`,
  blobCursor: `<DitherBlobCursor color="#7CFF67" class="h-40"><YourArea /></DitherBlobCursor>`,
  crosshair: `<DitherCrosshair color="#7CFF67" class="h-40"><YourArea /></DitherCrosshair>`,
  ghostCursor: `<DitherGhostCursor color="#7CFF67" class="h-40"><YourArea /></DitherGhostCursor>`,
  splashCursor: `<DitherSplashCursor color="#3DA5FF" class="h-40"><YourArea /></DitherSplashCursor>`,
  targetCursor: `<DitherTargetCursor color="#7CFF67" class="h-40"><YourArea /></DitherTargetCursor>`,
  pixelTrail: `<DitherPixelTrail color="#7CFF67" class="h-40"><YourArea /></DitherPixelTrail>`,
  imageTrail: `<DitherImageTrail class="h-44"><YourArea /></DitherImageTrail>`,
  metaBalls: `<DitherMetaBalls class="h-64" />`,
  metallicPaint: `<DitherMetallicPaint class="h-64" />`,
  noise: `<DitherNoise class="h-64" />`,
  cubes: `<DitherCubes class="h-64" />`,
  ribbons: `<DitherRibbons class="h-64" />`,
  shapeBlur: `<DitherShapeBlur class="h-64" />`,
  strands: `<DitherStrands class="h-64" />`,
  laserFlow: `<DitherLaserFlow class="h-64" />`,
  antigravity: `<DitherAntigravity class="h-52"><YourContent /></DitherAntigravity>`,
  logoLoop: `<DitherLogoLoop :items="['DITHER', 'BAYER', 'CANVAS', 'VUE', 'PIXELS']" />`,
  magicRings: `<DitherMagicRings class="h-52"><YourContent /></DitherMagicRings>`,
  magnetLines: `<DitherMagnetLines class="h-52" />`,
  orbitImages: `<DitherOrbitImages :items="['A', 'B', 'C', 'D', 'E']" />`,
  pixelTransition: `<DitherPixelTransition><YourCard /></DitherPixelTransition>`,
  ditherReveal: `<DitherReveal direction="right" :cell="4" :duration="1.4" :restart-key="nonce">
  <YourCard />
</DitherReveal>

// or drive it from a timeline: the mask is a pure function of progress
<DitherReveal :progress="p"><YourCard /></DitherReveal>

// the masks alone, for any element
import { wipeStyle } from "@dither-kit"
const m = wipeStyle(0.4, { cell: 4, direction: "down", width: 320, height: 180 })
el.style.maskImage = m?.image ?? ""`,
  stickerPeel: `<DitherStickerPeel><YourCard /></DitherStickerPeel>`,
  expandTabs: `<DitherExpandTabs v-model="tab" :tabs="[
  { value: 'home', label: 'Home' },
  { value: 'library', label: 'Library', color: 'purple' },
  { value: 'alerts', label: 'Alerts', color: 'red' },
]" />  <!-- only the active tab unfolds its label -->`,
  island: `<DitherIsland v-model="open" label="Deploy running" color="green" live>
  Build 214 · lint ok · 3 of 5 steps done.  <!-- unfolds beneath the pill -->
</DitherIsland>`,
  cardStack: `<DitherCardStack :items="cards" class="h-44 w-64" v-slot="{ item }">
  <article class="h-full rounded-lg border bg-card p-4">{{ item.title }}</article>
</DitherCardStack>  <!-- drag horizontally · flick advances · cycles -->`,
  dock: `<DitherDock :items="[
  { value: 'home', label: 'Home' },
  { value: 'studio', label: 'Studio', color: 'purple' },
  { value: 'docs', label: 'Docs', color: 'green' },
  { value: 'alerts', label: 'Alerts', color: 'red' },
]" @select="go" />  <!-- gaussian magnify around the pointer -->`,
  previewRail: `<DitherPreviewRail v-model="dest" :items="[
  { value: 'inbox', label: 'Inbox', hint: '12 unread threads', color: 'blue' },
  { value: 'drafts', label: 'Drafts', hint: '2 in progress', color: 'purple' },
  { value: 'planner', label: 'Planner', hint: 'Sprint 14 — day 3', color: 'green' },
  { value: 'metrics', label: 'Metrics', hint: 'p95 latency 42ms', color: 'orange' },
  { value: 'settings', label: 'Settings', hint: 'Workspace + theme' },
]" />  <!-- ticks pyramid around the pointer · preview floats beside the rail -->`,
  scrollProgress: `<DitherScrollProgress />                    <!-- viewport, fixed top -->
<DitherScrollProgress attach="parent" color="purple" />  <!-- nearest scrollable parent -->`,
  snapButton: `<DitherSnapButton :threshold="64" axis="x" color="green" @snap="confirm">
  Pull to deploy
</DitherSnapButton>
<!-- 1:1 drag · rubber-band past the line · border arms at the threshold ·
     release fires @snap · Enter/Space fires without the pull -->`,
  gooeyMenu: `<DitherGooeyMenu v-model="open" :items="[
  { value: 'add', label: 'Add', color: 'green' },
  { value: 'export', label: 'Export', color: 'blue' },
  { value: 'share', label: 'Share', color: 'purple' },
]" direction="up" @select="run" />
<!-- one SVG goo filter fuses the circles while they travel -->`,
  bouncyAccordion: `<DitherBouncyAccordion v-model="panel" :items="[
  { value: 'overview', label: 'Overview', hint: 'What shipped this week', icon: '▤',
    content: 'Charts, buttons and backgrounds now share one Bayer engine.' },
  { value: 'activity', label: 'Activity', hint: '3 deploys, 1 rollback', icon: '◷', color: 'green',
    content: 'Build 214 settled after a weighted spring — 8% overshoot, then calm.' },
  { value: 'alerts', label: 'Alerts', hint: 'One flapping check', icon: '◈', color: 'orange',
    content: 'p95 latency wobbled at 04:00 and snapped back on its own.' },
]" />  <!-- single-open · spring overshoot on open · brisk close -->`,
  expandingArrow: `<DitherExpandingArrow color="blue" @click="explore">
  Explore the kit
</DitherExpandingArrow>  <!-- dotted trail unrolls on hover or focus -->`,
  slideAction: `<DitherSlideAction label="Slide to deploy" color="green" @confirm="deploy" />
<!-- 1:1 thumb drag · flick momentum counts · early release springs back ·
     Enter/Space confirms without the slide -->`,
  holdAction: `<DitherHoldAction :duration="1200" direction="vertical" color="orange" @complete="purge">
  Hold to purge cache
</DitherHoldAction>  <!-- liquid fill with a dotted crest · release early to drain -->`,
  walletCard: `<DitherWalletCard v-model="account" :accounts="[
  { value: 'main', label: 'Main', address: '0x7f3a9c2e14b7d55aa93d', balance: 12480.52, change: 2.4 },
  { value: 'savings', label: 'Savings', address: '0x8b21e0c4a6f9d1327e55', balance: 8210.11, change: -1.1, color: 'purple' },
  { value: 'trading', label: 'Trading', address: '0x91cc4db2e87a30f6b214', balance: 3033.7, change: 0.6, color: 'orange' },
]" :recent="['gas fees', 'swap history']" notifications
  @action="run" @submit="find" @notify="openInbox" />
<!-- switcher + search morph from their triggers (recents listed) · digits
     cascade · privacy masks to ******* · copy-address gives a ✓ · bell pulses -->`,
}

const cardBox = "grid h-28 w-52 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground"
const cursorArea = "grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground"
const canvasBox = "h-64 w-full overflow-hidden rounded-lg border border-border/60"

/* Skiper-adjacent widgets: working demo state. */
const expandTab = ref("home")
const revealDirection = ref<"none" | "right" | "down">("none")
const revealNonce = ref(0)
const replayReveal = (direction: "none" | "right" | "down") => {
  revealDirection.value = direction
  revealNonce.value++
}
const islandOpen = ref(false)
const STACK_CARDS = [
  { title: "Prints · riso on cream", color: "purple" },
  { title: "Frames · oak 24×30", color: "blue" },
  { title: "Zines · issue 04", color: "green" },
  { title: "Stickers · die-cut set", color: "orange" },
] as { title: string; color: "purple" | "blue" | "green" | "orange" }[]
const stackIndex = ref(0)
const dockPick = ref("—")
const railDest = ref("inbox")
const snapCount = ref(0)
const gooeyOpen = ref(false)
const bouncyPanel = ref("overview")
const slideCount = ref(0)
const holdCount = ref(0)
const walletAccount = ref("main")
const walletNote = ref("—")
const stackPinned = ref(false)
const stackNote = ref("—")
const STACK_VARIANTS = ["stack", "fan", "condensed"] as const
const stackVariant = ref<(typeof STACK_VARIANTS)[number]>("stack")
const stackChip = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`
const stackSnippet = computed(
  () => `<DitherNotificationStack v-model="pinned"${stackVariant.value === "stack" ? "" : ` variant=\"${stackVariant.value}\"`} :items="[
  { id: 'n1', title: 'Deploy finished', body: 'dither-ui → production in 42s', time: '2m', icon: '↑', color: 'green' },
  { id: 'n2', title: 'New comment', body: 'Rei: “the drum snaps beautifully”', time: '16m', icon: '▤', color: 'blue' },
  { id: 'n3', title: 'Build warning', body: 'chunk index.js is 447 kB', time: '1h', icon: '◈', color: 'orange' },
]" @viewall="openInbox" />
<!-- stacked summary → readable list on hover, focus or tap · tap pins ·
     spring fan-out with per-card stagger -->`
)
const WALLET_ACCOUNTS = [
  { value: "main", label: "Main", address: "0x7f3a9c2e14b7d55aa93d", balance: 12480.52, change: 2.4 },
  { value: "savings", label: "Savings", address: "0x8b21e0c4a6f9d1327e55", balance: 8210.11, change: -1.1, color: "purple" },
  { value: "trading", label: "Trading", address: "0x91cc4db2e87a30f6b214", balance: 3033.7, change: 0.6, color: "orange" },
] as { value: string; label: string; address: string; balance: number; change: number; color?: "purple" | "orange" }[]
const gooeyPick = ref("—")
// Sequence demo: control changes double as restart keys — the plan rebuilds
// and replays whenever origin, easing or the replay nonce shifts.
const seqFrom = ref<StaggerFrom>("center")
const seqQuant = ref(false)
const seqNonce = ref(0)
const seqEasing = computed(() => (seqQuant.value ? steps(4) : linear))
const seqKey = computed(() => `${String(seqFrom.value)}|${seqQuant.value}|${seqNonce.value}`)
// Container demo: the panel is a native resize box; steppers are its
// keyboard path (both feed the same ResizeObserver the engine listens to).
const stageWidth = ref(100)
const cqPanel = ref<InstanceType<typeof DitherContainer> | null>(null)
function nudgeCq(delta: number): void {
  const host = cqPanel.value?.$el as HTMLElement | undefined
  if (!host) return
  const w = Math.round(host.getBoundingClientRect().width)
  host.style.width = `${Math.min(580, Math.max(200, w + delta))}px`
}
</script>

<template>
  <!-- Animated content -->
  <section id="animated-content" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Animated content</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Wrap anything to have it slide and fade into place the first time it enters
      the viewport. Direction, distance and timing are configurable — and
      <code class="text-foreground/80">distance</code> takes CSS lengths too:
      <code class="text-foreground/80">distance="4cqw"</code> reveals from 4% of the
      nearest query container, so the motion measures its parent instead of pixels.
    </p>
    <DemoCard :code="SNIPPETS.animatedContent">
      <DitherAnimatedContent :distance="40"><div :class="cardBox">Slides up on view</div></DitherAnimatedContent>
    </DemoCard>
    <PropsTable :rows="API.animatedContent" />
  </section>

  <!-- Fade content -->
  <section id="fade-content" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Fade content</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A pure fade-in on view, optionally de-blurring as it appears. The lighter
      cousin of Animated content when you only want opacity.
    </p>
    <DemoCard :code="SNIPPETS.fadeContent">
      <DitherFadeContent :blur="true"><div :class="cardBox">Fades in on view</div></DitherFadeContent>
    </DemoCard>
    <PropsTable :rows="API.fadeContent" />
  </section>

  <!-- Gradual blur -->
  <section id="gradual-blur" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Gradual blur</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A masked <code class="text-foreground/80">backdrop-filter</code> strip that
      progressively blurs toward an edge — the iOS-style soft fade over a scroll
      region.
    </p>
    <DemoCard :code="SNIPPETS.gradualBlur">
      <DitherGradualBlur position="bottom" :height="72" :strength="5" class="w-64">
        <div class="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
          <p v-for="n in 6" :key="n">Row {{ n }} — content scrolls under the blur band.</p>
        </div>
      </DitherGradualBlur>
    </DemoCard>
    <PropsTable :rows="API.gradualBlur" />
  </section>

  <!-- Star border -->
  <section id="star-border" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Star border</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A rounded frame with two bright glints traveling its top and bottom edges —
      a subtle animated outline for a CTA or badge.
    </p>
    <DemoCard :code="SNIPPETS.starBorder">
      <DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>
    </DemoCard>
    <PropsTable :rows="API.starBorder" />
  </section>

  <!-- Electric border -->
  <section id="electric-border" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Electric border</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An SVG turbulence filter jitters the frame edge into a crackling electric
      outline. Reduced motion drops the displacement.
    </p>
    <DemoCard :code="SNIPPETS.electricBorder">
      <DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>
    </DemoCard>
    <PropsTable :rows="API.electricBorder" />
  </section>

  <!-- Glare hover -->
  <section id="glare-hover" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Glare hover</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A diagonal sheen sweeps across the surface on hover — the glossy-card
      reflection, done with a single masked gradient. Hover the card.
    </p>
    <DemoCard :code="SNIPPETS.glareHover">
      <DitherGlareHover><div :class="cardBox">Hover me</div></DitherGlareHover>
    </DemoCard>
    <PropsTable :rows="API.glareHover" />
  </section>

  <!-- Magnet -->
  <section id="magnet" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Magnet</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The wrapped element is pulled toward the pointer while it is within range,
      easing back when the cursor leaves. Move your cursor near the button.
    </p>
    <DemoCard :code="SNIPPETS.magnet">
      <DitherMagnet :strength="0.4">
        <button type="button" class="rounded-md border border-border/60 bg-card px-4 py-2 text-sm">Magnet</button>
      </DitherMagnet>
    </DemoCard>
    <PropsTable :rows="API.magnet" />
  </section>

  <!-- Click spark -->
  <section id="click-spark" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Click spark</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A burst of spark lines radiates from every click inside the area, drawn on a
      lightweight canvas overlay. Click anywhere in the preview.
    </p>
    <DemoCard :code="SNIPPETS.clickSpark">
      <DitherClickSpark color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border border-border/60">
        <span class="text-sm text-muted-foreground">Click anywhere here</span>
      </DitherClickSpark>
    </DemoCard>
    <PropsTable :rows="API.clickSpark" />
  </section>

  <!-- Blob cursor -->
  <section id="blob-cursor" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Blob cursor</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A soft, screen-blended blob eases toward the pointer inside the area — a
      gooey cursor companion. Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.blobCursor">
      <DitherBlobCursor :class="cursorArea">Move your cursor here</DitherBlobCursor>
    </DemoCard>
    <PropsTable :rows="API.blobCursor" />
  </section>

  <!-- Crosshair -->
  <section id="crosshair" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Crosshair</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Full-height and full-width guide lines track the pointer across the area — a
      precision reticle. Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.crosshair">
      <DitherCrosshair :class="cursorArea">Move your cursor here</DitherCrosshair>
    </DemoCard>
    <PropsTable :rows="API.crosshair" />
  </section>

  <!-- Ghost cursor -->
  <section id="ghost-cursor" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Ghost cursor</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A tapering trail of fading dots chases the pointer on a canvas overlay.
      Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.ghostCursor">
      <DitherGhostCursor :class="cursorArea">Move your cursor here</DitherGhostCursor>
    </DemoCard>
    <PropsTable :rows="API.ghostCursor" />
  </section>

  <!-- Splash cursor -->
  <section id="splash-cursor" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Splash cursor</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Expanding ripple rings bloom along the pointer path, like drops on water.
      Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.splashCursor">
      <DitherSplashCursor :class="cursorArea">Move your cursor here</DitherSplashCursor>
    </DemoCard>
    <PropsTable :rows="API.splashCursor" />
  </section>

  <!-- Target cursor -->
  <section id="target-cursor" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Target cursor</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A slowly rotating corner-bracket reticle locks onto the pointer — a HUD
      targeting frame. Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.targetCursor">
      <DitherTargetCursor :class="cursorArea">Move your cursor here</DitherTargetCursor>
    </DemoCard>
    <PropsTable :rows="API.targetCursor" />
  </section>

  <!-- Pixel trail -->
  <section id="pixel-trail" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Pixel trail</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The pointer lights up cells of a pixel grid that then fade back out — a
      glowing wake across the lattice. Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.pixelTrail">
      <DitherPixelTrail :class="cursorArea">Move your cursor here</DitherPixelTrail>
    </DemoCard>
    <PropsTable :rows="API.pixelTrail" />
  </section>

  <!-- Image trail -->
  <section id="image-trail" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Image trail</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Tiles from a palette drop along the pointer path, rotating and shrinking as
      they fade — pass real image URLs via <code class="text-foreground/80">colors</code>
      swapped for tiles here. Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.imageTrail">
      <DitherImageTrail class="grid h-44 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">Move your cursor here</DitherImageTrail>
    </DemoCard>
    <PropsTable :rows="API.imageTrail" />
  </section>

  <!-- Meta balls -->
  <section id="meta-balls" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Meta balls</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Orbiting blobs fuse into a gooey metaball iso-surface, tinted and
      ordered-dithered through the kit engine. The pointer adds a blob.
    </p>
    <DemoCard :code="SNIPPETS.metaBalls">
      <div :class="canvasBox"><DitherMetaBalls /></div>
    </DemoCard>
    <PropsTable :rows="API.metaBalls" />
  </section>

  <!-- Metallic paint -->
  <section id="metallic-paint" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Metallic paint</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Iterative domain-warped reflections read as flowing liquid chrome — fully
      opaque, dithered across a metallic ramp.
    </p>
    <DemoCard :code="SNIPPETS.metallicPaint">
      <div :class="canvasBox"><DitherMetallicPaint /></div>
    </DemoCard>
    <PropsTable :rows="API.metallicPaint" />
  </section>

  <!-- Noise -->
  <section id="noise" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Noise</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Animated hashed grain thresholded against the Bayer matrix — living static
      for a texture overlay. Tune <code class="text-foreground/80">density</code> and blend it over content.
    </p>
    <DemoCard :code="SNIPPETS.noise">
      <div :class="canvasBox"><DitherNoise /></div>
    </DemoCard>
    <PropsTable :rows="API.noise" />
  </section>

  <!-- Cubes -->
  <section id="cubes" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Cubes</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A rhombille tiling shades into a field of isometric cubes, each face lit and
      pulsing on noise. Tinted and ordered-dithered.
    </p>
    <DemoCard :code="SNIPPETS.cubes">
      <div :class="canvasBox"><DitherCubes /></div>
    </DemoCard>
    <PropsTable :rows="API.cubes" />
  </section>

  <!-- Ribbons -->
  <section id="ribbons" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Ribbons</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Thick flowing bands ride wavy fbm centerlines, bright at the core and tinted
      per ribbon. The pointer bends nearby ribbons toward it.
    </p>
    <DemoCard :code="SNIPPETS.ribbons">
      <div :class="canvasBox"><DitherRibbons /></div>
    </DemoCard>
    <PropsTable :rows="API.ribbons" />
  </section>

  <!-- Shape blur -->
  <section id="shape-blur" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Shape blur</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A big soft blob morphs on noise and drifts toward the pointer — a gentle
      out-of-focus shape. Move your cursor over it.
    </p>
    <DemoCard :code="SNIPPETS.shapeBlur">
      <div :class="canvasBox"><DitherShapeBlur /></div>
    </DemoCard>
    <PropsTable :rows="API.shapeBlur" />
  </section>

  <!-- Strands -->
  <section id="strands" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Strands</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Dozens of thin filaments sway on fbm like blown hair, tinted by depth and
      ordered-dithered with transparent gaps.
    </p>
    <DemoCard :code="SNIPPETS.strands">
      <div :class="canvasBox"><DitherStrands /></div>
    </DemoCard>
    <PropsTable :rows="API.strands" />
  </section>

  <!-- Laser flow -->
  <section id="laser-flow" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Laser flow</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Sharp horizontal beams sweep with additive bloom and a faint jitter, tinted
      per beam — a scanning laser array.
    </p>
    <DemoCard :code="SNIPPETS.laserFlow">
      <div :class="canvasBox"><DitherLaserFlow /></div>
    </DemoCard>
    <PropsTable :rows="API.laserFlow" />
  </section>

  <!-- Antigravity -->
  <section id="antigravity" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Antigravity</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A field of motes drifts upward and wraps — gravity in reverse, layered
      behind your content.
    </p>
    <DemoCard :code="SNIPPETS.antigravity">
      <DitherAntigravity :class="cursorArea">Antigravity</DitherAntigravity>
    </DemoCard>
    <PropsTable :rows="API.antigravity" />
  </section>

  <!-- Logo loop -->
  <section id="logo-loop" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Logo loop</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A seamless infinite marquee of items — pass logos or wordmarks and it loops
      forever with a measured wrap.
    </p>
    <DemoCard :code="SNIPPETS.logoLoop">
      <div class="w-full text-xl font-medium tracking-tight text-muted-foreground">
        <DitherLogoLoop :items="['DITHER', 'BAYER', 'CANVAS', 'VUE', 'PIXELS']" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.logoLoop" />
  </section>

  <!-- Magic rings -->
  <section id="magic-rings" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Magic rings</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Concentric rings pulse outward from the center on a stagger — a radar-ping
      halo around whatever you wrap.
    </p>
    <DemoCard :code="SNIPPETS.magicRings">
      <DitherMagicRings class="h-52 w-full">
        <span class="grid h-12 w-12 place-items-center rounded-full border border-border/60 bg-card text-xs text-muted-foreground">core</span>
      </DitherMagicRings>
    </DemoCard>
    <PropsTable :rows="API.magicRings" />
  </section>

  <!-- Magnet lines -->
  <section id="magnet-lines" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Magnet lines</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A grid of little needles all swivel to point at the pointer, like iron
      filings over a magnet. Move your cursor over the box.
    </p>
    <DemoCard :code="SNIPPETS.magnetLines">
      <DitherMagnetLines :class="cursorArea" />
    </DemoCard>
    <PropsTable :rows="API.magnetLines" />
  </section>

  <!-- Orbit images -->
  <section id="orbit-images" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Orbit images</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Items ride a circular orbit around a center point — pass avatars, logos or
      labels. Counter-rotated so they stay upright.
    </p>
    <DemoCard :code="SNIPPETS.orbitImages">
      <div class="grid min-h-56 place-items-center">
        <DitherOrbitImages :items="['A', 'B', 'C', 'D', 'E']" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.orbitImages" />
  </section>

  <!-- Pixel transition -->
  <section id="pixel-transition" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Pixel transition</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A grid of pixel cells covers the content and dissolves in a scattered order
      on hover, revealing what is underneath. Hover the card.
    </p>
    <DemoCard :code="SNIPPETS.pixelTransition">
      <DitherPixelTransition class="grid h-32 w-56 place-items-center rounded-lg border border-border/60" color="#181b22">
        <span class="text-lg tracking-tight">Revealed</span>
      </DitherPixelTransition>
    </DemoCard>
    <PropsTable :rows="API.pixelTransition" />
  </section>

  <!-- Dither reveal -->
  <section id="dither-reveal" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dither reveal</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Any content comes in through an ordered-dither mask. A dissolve resolves
      cell by cell in the Bayer order; a wipe moves a solid front with a dithered
      band behind it. The mask is a pure function of progress, so a seeked frame
      (the player, a video export) gets the same cells every time, and the
      Studio's reels cut between frames with it. Pass <code class="text-foreground/80">progress</code>
      to drive it from your own timeline.
    </p>
    <DemoCard :code="SNIPPETS.ditherReveal">
      <div class="flex flex-col items-center gap-3">
        <DitherReveal :direction="revealDirection" :cell="4" :duration="1.4" :restart-key="revealNonce" class="h-32 w-56">
          <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card">
            <span class="text-lg tracking-tight">Revealed</span>
          </div>
        </DitherReveal>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="opt in ([['none', 'dissolve'], ['right', 'wipe right'], ['down', 'wipe down']] as const)"
            :key="opt[0]"
            type="button"
            class="rounded border px-2 py-1 text-[11px] tracking-wide"
            :class="revealDirection === opt[0] ? 'border-accent bg-accent/80 text-accent-foreground' : 'border-border/60 text-muted-foreground hover:bg-accent/40'"
            :aria-pressed="revealDirection === opt[0]"
            @click="replayReveal(opt[0])"
          >
            {{ opt[1] }}
          </button>
          <button type="button" class="rounded border border-border/60 px-2 py-1 text-[11px] tracking-wide text-muted-foreground hover:bg-accent/40" @click="revealNonce++">replay</button>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.ditherReveal" />
  </section>

  <!-- Sticker peel -->
  <section id="sticker-peel" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Sticker peel</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A corner of the card peels up on hover with a soft curl shadow — the sticker
      lift. Hover the card.
    </p>
    <DemoCard :code="SNIPPETS.stickerPeel">
      <DitherStickerPeel>
        <div class="grid h-24 w-40 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground">Peel me</div>
      </DitherStickerPeel>
    </DemoCard>
    <PropsTable :rows="API.stickerPeel" />
  </section>

  <section id="expand-tabs" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Expand tabs</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An icon bar where only the active tab unfolds its label — the rest stay
      square glyphs. The label slides through the house 0fr grid trick.
    </p>
    <DemoCard :code="SNIPPETS.expandTabs">
      <div class="grid min-h-24 place-items-center">
        <DitherExpandTabs
          v-model="expandTab"
          :tabs="[
            { value: 'home', label: 'Home' },
            { value: 'library', label: 'Library', color: 'purple' },
            { value: 'alerts', label: 'Alerts', color: 'red' },
          ]"
        />
      </div>
    </DemoCard>
    <PropsTable :rows="API.expandTabs" />
  </section>

  <section id="island" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Island</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A morphing status pill — the compact row keeps its pulse while the
      detail unfolds beneath. Escape collapses; reduced motion snaps.
    </p>
    <DemoCard :code="SNIPPETS.island">
      <div class="grid min-h-28 place-items-center">
        <DitherIsland v-model="islandOpen" label="Deploy running" color="green" live class="w-64">
          Build 214 · lint ok · bundle 84kB · 3 of 5 steps done.
        </DitherIsland>
      </div>
    </DemoCard>
    <PropsTable :rows="API.island" />
  </section>

  <section id="card-stack" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Card stack</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A swipe deck on the kit's own gesture math — 1:1 tracking, rubber-band
      past the edge, a flick or a far drag sends the card flying and the
      stack rises. Drag the top card.
    </p>
    <DemoCard :code="SNIPPETS.cardStack">
      <div class="grid min-h-56 place-items-center">
        <div>
          <DitherCardStack :items="STACK_CARDS" class="h-40 w-64" @advance="stackIndex = $event">
            <template #default="{ item }">
              <article class="flex h-full flex-col justify-between rounded-lg border border-border/60 bg-card/90 p-4">
                <span class="size-2 rounded-[2px]" :style="{ background: `var(--swatch-${item.color})` }" aria-hidden="true" />
                <p class="font-mono text-[13px] text-foreground">{{ item.title }}</p>
              </article>
            </template>
          </DitherCardStack>
          <p class="mt-3 text-center text-[10px] tabular-nums text-muted-foreground">card {{ stackIndex + 1 }} of {{ STACK_CARDS.length }}</p>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.cardStack" />
  </section>

  <section id="dock" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dock</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A hover-magnifying dock — items swell on a gaussian falloff around the
      pointer and settle when it leaves. Reduced motion keeps the row still.
    </p>
    <DemoCard :code="SNIPPETS.dock">
      <div class="grid min-h-28 place-items-end justify-center pb-2">
        <div class="text-center">
          <DitherDock
            :items="[
              { value: 'home', label: 'Home' },
              { value: 'studio', label: 'Studio', color: 'purple' },
              { value: 'docs', label: 'Docs', color: 'green' },
              { value: 'alerts', label: 'Alerts', color: 'red' },
            ]"
            @select="dockPick = $event"
          />
          <p class="mt-2 text-[10px] text-muted-foreground">selected: {{ dockPick }}</p>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.dock" />
  </section>

  <section id="preview-rail" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Preview rail</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A Codex app-inspired navigation rail — compact ticks form a pyramid
      around the pointer and reveal a floating destination preview beside the
      rail. Keyboard focus previews too; reduced motion keeps the ticks still.
    </p>
    <DemoCard :code="SNIPPETS.previewRail">
      <div class="flex min-h-56 items-center justify-start pl-6">
        <DitherPreviewRail
          v-model="railDest"
          :items="[
            { value: 'inbox', label: 'Inbox', hint: '12 unread threads', color: 'blue' },
            { value: 'drafts', label: 'Drafts', hint: '2 in progress', color: 'purple' },
            { value: 'planner', label: 'Planner', hint: 'Sprint 14 — day 3', color: 'green' },
            { value: 'metrics', label: 'Metrics', hint: 'p95 latency 42ms', color: 'orange' },
            { value: 'settings', label: 'Settings', hint: 'Workspace + theme' },
          ]"
        />
        <p class="ml-10 text-[10px] text-muted-foreground">destination: {{ railDest }}</p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.previewRail" />
  </section>

  <section id="scroll-progress" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Scroll progress</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Reading progress as a dithered bar — it composes DitherProgress and
      rides the viewport edge, or the top of any scrollable parent. Scroll
      the box.
    </p>
    <DemoCard :code="SNIPPETS.scrollProgress">
      <div class="relative mx-auto h-48 max-w-md overflow-y-auto rounded-lg border border-border/60">
        <DitherScrollProgress attach="parent" color="purple" />
        <div class="grid gap-2 p-4" aria-hidden="true">
          <div v-for="i in 14" :key="i" class="h-2 rounded-sm bg-border/50" :class="i % 3 === 0 ? 'w-2/3' : 'w-full'" />
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.scrollProgress" />
  </section>

  <section id="snap-button" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Snap button</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Pull to confirm — drag past the line and the border arms; release fires
      and the button springs home. Short pulls just spring. Enter and Space
      fire without the pull; reduced motion skips the spring.
    </p>
    <DemoCard :code="SNIPPETS.snapButton">
      <div class="grid min-h-28 place-items-center gap-3">
        <DitherSnapButton :threshold="64" axis="x" color="green" @snap="snapCount++">
          Pull to deploy
        </DitherSnapButton>
        <p class="text-[10px] tabular-nums text-muted-foreground">deploys fired: {{ snapCount }}</p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.snapButton" />
  </section>

  <section id="gooey-menu" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Gooey menu</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Actions that melt out of one trigger — an SVG goo filter fuses the
      circles while they travel, then they settle apart. Escape collapses;
      reduced motion drops the travel.
    </p>
    <DemoCard :code="SNIPPETS.gooeyMenu">
      <div class="grid min-h-64 place-items-end justify-center pb-4">
        <div class="text-center">
          <DitherGooeyMenu
            v-model="gooeyOpen"
            direction="up"
            :items="[
              { value: 'add', label: 'Add', color: 'green' },
              { value: 'export', label: 'Export', color: 'blue' },
              { value: 'share', label: 'Share', color: 'purple' },
            ]"
            @select="gooeyPick = $event"
          />
          <p class="mt-3 text-[10px] text-muted-foreground">picked: {{ gooeyPick }}</p>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.gooeyMenu" />
  </section>

  <section id="bouncy-accordion" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Bouncy accordion</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A single-open accordion with a weighted spring layout — panels overshoot
      and settle on a sampled damped-spring easing, icon rows lead each header,
      and content rises into view. Reduced motion reveals instantly.
    </p>
    <DemoCard :code="SNIPPETS.bouncyAccordion">
      <DitherBouncyAccordion
        v-model="bouncyPanel"
        class="mx-auto max-w-sm"
        :items="[
          { value: 'overview', label: 'Overview', hint: 'What shipped this week', icon: '▤',
            content: 'Charts, buttons and backgrounds now share one Bayer engine.' },
          { value: 'activity', label: 'Activity', hint: '3 deploys, 1 rollback', icon: '◷', color: 'green',
            content: 'Build 214 settled after a weighted spring — 8% overshoot, then calm.' },
          { value: 'alerts', label: 'Alerts', hint: 'One flapping check', icon: '◈', color: 'orange',
            content: 'p95 latency wobbled at 04:00 and snapped back on its own.' },
        ]"
      />
    </DemoCard>
    <PropsTable :rows="API.bouncyAccordion" />
  </section>

  <section id="expanding-arrow" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Expanding arrow</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An accent tile that expands into a dotted-arrow trail on hover or focus
      — the trail is stamped from the same accent hue. Reduced motion reveals
      it instantly.
    </p>
    <DemoCard :code="SNIPPETS.expandingArrow">
      <div class="flex min-h-24 items-center justify-center">
        <DitherExpandingArrow color="blue">Explore the kit</DitherExpandingArrow>
      </div>
    </DemoCard>
    <PropsTable :rows="API.expandingArrow" />
  </section>

  <section id="slide-action" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Slide action</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Drag the thumb to the end of the track to confirm — flick momentum
      counts — or release early and it springs back. Enter or Space confirms
      without the slide.
    </p>
    <DemoCard :code="SNIPPETS.slideAction">
      <div class="flex min-h-24 flex-col items-center justify-center gap-3">
        <DitherSlideAction label="Slide to deploy" color="green" @confirm="slideCount++" />
        <p class="font-mono text-[10px] text-muted-foreground">deploys: {{ slideCount }}</p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.slideAction" />
  </section>

  <section id="hold-action" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Hold action</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Hold to complete — a liquid fill with a dotted crest rises (or slides)
      while you press; release early and it drains back. A held Enter or Space
      works the same way.
    </p>
    <DemoCard :code="SNIPPETS.holdAction">
      <div class="flex min-h-24 flex-col items-center justify-center gap-3">
        <div class="flex items-center gap-4">
          <DitherHoldAction color="orange" @complete="holdCount++">Hold to purge cache</DitherHoldAction>
          <DitherHoldAction direction="horizontal" color="red" :duration="900" @complete="holdCount++">Hold to delete</DitherHoldAction>
        </div>
        <p class="font-mono text-[10px] text-muted-foreground">completed: {{ holdCount }}</p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.holdAction" />
  </section>

  <section id="wallet-card" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Wallet card</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A wallet overview card — the account switcher and search morph open
      from their triggers (recents listed in the panel), the balance cascades
      in with a change pill and privacy toggle, the address copies with
      feedback, the bell carries an unread pulse, and Send / Deposit / Swap /
      Buy report through one event.
    </p>
    <DemoCard :code="SNIPPETS.walletCard">
      <div class="flex min-h-72 flex-col items-center justify-center gap-3">
        <DitherWalletCard
          v-model="walletAccount"
          :accounts="WALLET_ACCOUNTS"
          :recent="['gas fees', 'swap history']"
          notifications
          @action="walletNote = $event"
          @submit="walletNote = 'search: ' + $event"
          @notify="walletNote = 'notifications'"
        />
        <p class="font-mono text-[10px] text-muted-foreground">last: {{ walletNote }}</p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.walletCard" />
  </section>

  <section id="notification-stack" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Notification stack</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Compact notification cards that spring from a stacked summary into a
      readable list on hover, focus or tap — tap pins the list open, and the
      view-all row appears with the expansion. Reduced motion snaps.
    </p>
    <DemoCard :code="stackSnippet">
      <div class="flex min-h-72 flex-col items-center justify-center gap-4">
        <DitherNotificationStack
          v-model="stackPinned"
          :variant="stackVariant"
          :items="[
            { id: 'n1', title: 'Deploy finished', body: 'dither-ui → production in 42s', time: '2m', icon: '↑', color: 'green' },
            { id: 'n2', title: 'New comment', body: 'Rei: “the drum snaps beautifully”', time: '16m', icon: '▤', color: 'blue' },
            { id: 'n3', title: 'Build warning', body: 'chunk index.js is 447 kB', time: '1h', icon: '◈', color: 'orange' },
          ]"
          @viewall="stackNote = 'view all'"
        />
        <p class="font-mono text-[10px] text-muted-foreground">pinned: {{ stackPinned }} · last: {{ stackNote }}</p>
      </div>
    </DemoCard>
    <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
    <div class="mt-3 flex gap-1">
      <button
        v-for="v in STACK_VARIANTS"
        :key="v"
        type="button"
        :aria-pressed="stackVariant === v"
        :class="stackChip(stackVariant === v)"
        @click="stackVariant = v"
      >
        {{ v }}
      </button>
    </div>
    <PropsTable :rows="API.notificationStack" />
  </section>

  <!-- Step timing -->
  <section id="step-timing" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Step timing</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Quantized time for a quantized renderer — <code class="text-foreground/80">steps()</code>
      samples progress instead of interpolating it, the temporal twin of the Bayer threshold.
      One keyframe run, three clocks: smooth, six-step (both endpoints visible), three-step
      (the end value lands only on the last frame).
    </p>
    <DemoCard :code="SNIPPETS.stepTiming">
      <div class="grid gap-2.5">
        <div class="timing-lane">
          <span class="timing-tag">linear</span>
          <i class="timing-probe bg-accent/70" />
        </div>
        <div class="timing-lane">
          <span class="timing-tag">steps(6, jump-none)</span>
          <i class="timing-probe stair-6 bg-accent/70" />
        </div>
        <div class="timing-lane">
          <span class="timing-tag">steps(3, jump-end)</span>
          <i class="timing-probe stair-3 bg-accent/70" />
        </div>
      </div>
    </DemoCard>
    <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
      The kit's shared field runtime takes the same idea down at the driver layer:
      <code class="text-foreground/80">frameRate</code> paints only on wall-time boundaries and
      holds the raster between them — stop-motion <i>and</i> fewer buffer uploads. Two Auroras,
      same clock source, different cadence.
    </p>
    <DemoCard :code="SNIPPETS.stepTimingAurora">
      <div class="grid grid-cols-2 gap-3">
        <div class="overflow-hidden rounded-lg border border-border/60">
          <p class="border-b border-border/60 bg-card/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            smooth
          </p>
          <div class="h-36"><DitherAurora /></div>
        </div>
        <div class="overflow-hidden rounded-lg border border-border/60">
          <p class="border-b border-border/60 bg-card/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            frame-rate 8
          </p>
          <div class="h-36"><DitherAurora :frame-rate="8" /></div>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.stepTiming" />
  </section>

  <!-- Sequences -->
  <section id="sequences" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Sequences</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Many animations, one clock. The timeline algebra flattens serial chains, parallel
      groups, staggered waves and loops into a single plan; the driver samples it and writes
      <code class="text-foreground/80">--seq-p</code> +
      <code class="text-foreground/80">data-seq</code> onto each child — children style
      themselves, the engine only owns time. Ease with
      <code class="text-foreground/80">steps()</code> and the whole wave quantizes.
    </p>
    <DemoCard :code="SNIPPETS.sequences">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button
          v-for="opt in (['start', 'center', 'end', 'edges'] as const)"
          :key="opt"
          class="rounded border px-2 py-1 text-[11px] tracking-wide"
          :class="
            seqFrom === opt
              ? 'border-accent bg-accent/80 text-accent-foreground'
              : 'border-border/60 text-muted-foreground hover:bg-accent/40'
          "
          :aria-pressed="seqFrom === opt"
          @click="seqFrom = opt"
        >
          {{ opt }}
        </button>
        <button
          class="rounded border px-2 py-1 text-[11px] tracking-wide"
          :class="
            seqQuant
              ? 'border-accent bg-accent/80 text-accent-foreground'
              : 'border-border/60 text-muted-foreground hover:bg-accent/40'
          "
          :aria-pressed="seqQuant"
          @click="seqQuant = !seqQuant"
        >
          {{ seqQuant ? "steps(4)" : "linear" }}
        </button>
        <button
          class="rounded border border-border/60 px-2 py-1 text-[11px] tracking-wide text-muted-foreground hover:bg-accent/40"
          @click="seqNonce++"
        >
          replay
        </button>
      </div>
      <DitherSequence
        :stagger="0.07"
        :from="seqFrom"
        :duration="0.6"
        :loop="3"
        yoyo
        :easing="seqEasing"
        :restart-key="seqKey"
        class="grid grid-cols-6 gap-2"
      >
        <div v-for="i in 12" :key="i" class="seq-cell">{{ i }}</div>
      </DitherSequence>
    </DemoCard>
    <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
      Each cell reads only its own <code class="text-foreground/80">--seq-p</code>: rise on
      the forward leg, sink on the yoyo leg, three cycles, settled at 1. Change the origin
      and the delay wave recomputes; quantize and <code class="text-foreground/80">steps(4)</code>
      buckets the entire group into four positions. Reduced motion gets the settled state
      with zero frames.
    </p>
    <PropsTable :rows="API.sequences" />
  </section>

  <!-- Container queries -->
  <section id="container-queries" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Container queries</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A card in a sidebar and the same card in a wide main column are not the same card — so
      stop asking the viewport.
      <code class="text-foreground/80">DitherContainer</code> makes its own box the query
      target: it measures the content box (exactly what
      <code class="text-foreground/80">@container</code> sees), resolves a bucket scale onto
      <code class="text-foreground/80">data-cq</code> +
      <code class="text-foreground/80">--cq-w</code> /
      <code class="text-foreground/80">--cq-i</code>, and exposes the same state through the
      scoped slot — children restyle themselves in CSS while animations re-parameterize in JS.
    </p>
    <DemoCard :code="SNIPPETS.containerQueries">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-border/60 px-2.5 py-1 text-[11px] tracking-wide text-muted-foreground hover:bg-accent/40"
          aria-label="Narrow the container by 40 pixels"
          @click="nudgeCq(-40)"
        >
          −
        </button>
        <button
          type="button"
          class="rounded border border-border/60 px-2.5 py-1 text-[11px] tracking-wide text-muted-foreground hover:bg-accent/40"
          aria-label="Widen the container by 40 pixels"
          @click="nudgeCq(40)"
        >
          +
        </button>
        <span class="text-[11px] text-muted-foreground">
          drag the corner too — every child reads this box, never the viewport
        </span>
      </div>
      <DitherContainer
        ref="cqPanel"
        v-slot="{ width, size, index, matches }"
        :scale="{ xs: 0, sm: 260, md: 360, lg: 450, xl: 530 }"
        :step="8"
        name="demo"
        class="cq-panel"
      >
        <div class="cq-readout">
          <span class="cq-bucket">{{ size }}</span>
          <span>{{ width }}px · q8 {{ quantize(width, 8) }} · matches {{ matches.join(" ") }}</span>
        </div>
        <DitherSequence
          :stagger="0.03 + index * 0.02"
          :from="index >= 3 ? 'center' : 'start'"
          :restart-key="size ?? 'xs'"
          class="cq-grid"
        >
          <div v-for="i in 12" :key="i" class="seq-cell">{{ i }}</div>
        </DitherSequence>
        <div class="cq-scan" aria-hidden="true" />
      </DitherContainer>
    </DemoCard>
    <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
      The grid re-columns purely from <code class="text-foreground/80">[data-cq]</code> — CSS
      reading the container's own state — while the Sequence's stagger, origin and replay derive
      from the same bucket through the slot. Narrow it to
      <code class="text-foreground/80">xs</code> and the wave tightens to 0.03s/cell; widen to
      <code class="text-foreground/80">xl</code> and it fans from the center at 0.11s.
      <code class="text-foreground/80">quantize()</code> rounds widths to the step so readouts
      and canvas painters hold like frames — the spatial half of the timing engine's step idea.
      This demo overrides <code class="text-foreground/80">:scale</code> so all five buckets
      fit the docs column; the default <code class="text-foreground/80">CONTAINER_SCALE</code>
      targets wider shells. The blue bar runs the shipped
      <code class="text-foreground/80">dither-cq-traverse</code> keyframe:
      <code class="text-foreground/80">translateX(±100cqw)</code> makes its journey exactly one
      container width, so a resize re-scales the animation live — where
      <code class="text-foreground/80">translateX(50%)</code> would measure the bar itself and
      <code class="text-foreground/80">vw</code> would measure the viewport.
    </p>
    <PropsTable :rows="API.containerQueries" />
  </section>

  <!-- Stage: layers in container units -->
  <section id="stage" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Stage</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Layers in container units. A <code class="text-foreground/80">DitherStage</code> is a
      size query container with one clock — the kit's, so it seeks for video — and each
      <code class="text-foreground/80">DitherLayer</code> runs keyframes whose lengths keep
      their units through interpolation: <code class="text-foreground/80">10cqw</code> to
      <code class="text-foreground/80">30cqw</code> is <code class="text-foreground/80">20cqw</code>
      halfway, mixed units become a <code class="text-foreground/80">calc()</code>. Canvas,
      SVG and DOM layers move exactly relative to the stage at any size, and the same sample
      resolves to px through the slot for anything that paints. Shrink the stage: every path
      shrinks with it.
    </p>
    <DemoCard :code="SNIPPETS.stage">
      <div class="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <label class="flex items-center gap-2">
          stage width
          <input v-model.number="stageWidth" type="range" min="40" max="100" step="5" name="stage-width" class="accent-foreground" />
        </label>
        <span class="tabular-nums">{{ stageWidth }}%</span>
      </div>
      <DitherStage v-slot="{ width, height }" :duration="8" class="stage-demo" :style="{ width: `${stageWidth}%` }">
        <DitherLayer :keyframes="[{ x: '-6cqw' }, { x: '6cqw' }]" :duration="8" yoyo loop class="stage-sky">
          <DitherAurora :colors="['#1f6fd6', '#9ec5ff', '#ffffff']" :speed="0.6" label="Sky" class="h-full" />
        </DitherLayer>
        <DitherLayer :keyframes="[{ x: 0 }, { x: '-10cqw' }]" :duration="8" yoyo loop>
          <svg class="stage-hills far" viewBox="0 0 132 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40 V26 Q12 14 24 22 T48 18 T72 24 T96 14 T120 22 T132 18 V40 Z" />
          </svg>
        </DitherLayer>
        <DitherLayer :keyframes="[{ x: 0 }, { x: '-24cqw' }]" :duration="8" yoyo loop>
          <svg class="stage-hills near" viewBox="0 0 148 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40 V30 Q14 22 28 30 T56 24 T84 32 T112 22 T140 30 T148 26 V40 Z" />
          </svg>
        </DitherLayer>
        <DitherLayer
          :keyframes="[
            { at: 0, x: '80cqw', y: '12cqh', rotate: 0 },
            { at: '50%', easing: 'ease-in-out', rotate: '0.5turn' },
            { x: '20cqw', y: '8cqh', rotate: '1turn' },
          ]"
          :duration="8"
          loop
          origin="0 0"
          class="stage-moon"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <circle cx="9" cy="9" r="2" class="crater" />
            <circle cx="15" cy="14" r="1.5" class="crater" />
          </svg>
        </DitherLayer>
        <DitherLayer v-slot="{ cx, cy }" :keyframes="[{ cx: '10cqw', cy: '70cqh' }, { cx: '90cqw', cy: '40cqh' }]" :duration="4" yoyo loop>
          <svg :viewBox="`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`" class="stage-dot" aria-hidden="true">
            <circle :cx="cx" :cy="cy" r="4" />
            <text :x="cx + 8" :y="cy + 3">{{ Math.round(cx) }}, {{ Math.round(cy) }}px</text>
          </svg>
        </DitherLayer>
      </DitherStage>
    </DemoCard>
    <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
      The aurora is a canvas surface riding a layer: it drifts twelve percent of the stage,
      never twelve percent of the viewport. The two hills are SVGs on their own layers at two
      speeds — parallax in container units. The moon places its keys with
      <code class="text-foreground/80">at</code> (seconds or a percentage) and eases one segment.
      The last layer keeps custom keys, <code class="text-foreground/80">cx</code> and
      <code class="text-foreground/80">cy</code>, which the slot hands back resolved to px
      against the measured box — exactly the numbers a canvas painter needs. Nothing here is a CSS
      animation: the stage's clock samples every track, so a frame exported to video lands on
      the same moment.
    </p>
    <PropsTable :rows="API.stage" />
    <PropsTable :rows="API.layer" />
  </section>
</template>

<style scoped>
/* Lane chrome + the shared sweep; the two stair classes swap only the timing
   function, so the lanes differ by clock alone. */
.timing-lane {
  position: relative;
  height: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(120, 120, 140, 0.35);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.02);
}
.timing-tag {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted-foreground, #8a8a99);
  pointer-events: none;
}
.timing-probe {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 30%;
  transform: translateX(-110%);
  animation: timing-sweep 2.8s linear infinite alternate;
}
.stair-6 {
  animation-timing-function: steps(6, jump-none);
}
.stair-3 {
  animation-timing-function: steps(3, jump-end);
}
@keyframes timing-sweep {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(340%); /* 30%-wide block sweeps the whole lane */
  }
}
/* Sequence demo cell — the driver's per-child contract: eased progress in,
   lifecycle state as data-seq. Fallback 0 hides the cell until first paint. */
.seq-cell {
  display: flex;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 120, 140, 0.35);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.03);
  font-size: 10px;
  color: var(--color-muted-foreground, #8a8a99);
  opacity: var(--seq-p, 0);
  transform: translateY(calc((1 - var(--seq-p, 0)) * 16px));
}
/* Container-query demo — the host is a native resize box; children switch
   off its [data-cq] attribute (CSS route) while the slot drives JS. */
.stage-demo {
  height: 230px;
  margin: 0 auto;
  border: 1px solid rgba(120, 120, 140, 0.35);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  transition: width 220ms cubic-bezier(0.2, 0, 0, 1);
}
.stage-sky {
  inset: 0 -6cqw;
}
.stage-hills {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 110%;
  height: 58%;
}
.stage-hills.far path {
  fill: rgba(31, 111, 214, 0.35);
}
.stage-hills.near {
  width: 124%;
  height: 42%;
}
.stage-hills.near path {
  fill: rgba(11, 26, 58, 0.95);
}
.stage-moon {
  inset: auto;
  width: 28px;
  height: 28px;
}
.stage-moon circle {
  fill: rgba(255, 255, 255, 0.85);
}
.stage-moon .crater {
  fill: rgba(11, 26, 58, 0.6);
}
.stage-dot {
  width: 100%;
  height: 100%;
}
.stage-dot circle {
  fill: var(--color-accent);
}
.stage-dot text {
  font: 10px var(--font-mono);
  fill: var(--color-muted-foreground);
}
@media (prefers-reduced-motion: reduce) {
  .stage-demo {
    transition: none;
  }
}
.cq-panel {
  width: 500px;
  max-width: 100%;
  overflow: hidden;
  resize: horizontal; /* native corner grip; the engine's RO reports each drag */
  border: 1px solid rgba(120, 120, 140, 0.35);
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
}
.cq-readout {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted-foreground, #8a8a99);
}
.cq-bucket {
  color: #3f8ff3;
  font-weight: 600;
}
.cq-grid {
  display: grid;
  gap: 0.5rem;
}
/* Bucket → layout: columns come from the CONTAINER's own attribute. */
.cq-panel[data-cq="xs"] .cq-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.cq-panel[data-cq="sm"] .cq-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.cq-panel[data-cq="md"] .cq-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.cq-panel[data-cq="lg"] .cq-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}
.cq-panel[data-cq="xl"] .cq-grid {
  grid-template-columns: repeat(8, minmax(0, 1fr));
}
/* The extremes carry a colour marker so the attribute flip is visible. */
.cq-panel[data-cq="xs"] .seq-cell {
  border-color: #d9a441;
}
.cq-panel[data-cq="xl"] .seq-cell {
  border-color: #3f8ff3;
}
/* Motion route: the shipped keyframe measures the container (100cqw), so
   the bar's whole journey re-scales on every resize. */
.cq-scan {
  height: 2px;
  width: 28px;
  margin-top: 0.5rem;
  background: #3f8ff3;
  animation: dither-cq-traverse 2.8s ease-in-out infinite alternate;
}
</style>
