import { createEffect, createMemo, createSignal, For } from "solid-js"
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
} from "@dither-ui/kit"
import { linear, quantize, steps } from "@dither-ui/kit"
import type { StaggerFrom } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import TransitionSection from "./TransitionSection"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import stageProps from "virtual:dither-props/DitherStage"
import layerProps from "virtual:dither-props/DitherLayer"
import sequenceProps from "virtual:dither-props/DitherSequence"
import containerProps from "virtual:dither-props/DitherContainer"
import expandTabsProps from "virtual:dither-props/DitherExpandTabs"
import islandProps from "virtual:dither-props/DitherIsland"
import cardStackProps from "virtual:dither-props/DitherCardStack"
import dockProps from "virtual:dither-props/DitherDock"
import previewRailProps from "virtual:dither-props/DitherPreviewRail"
import scrollProgressProps from "virtual:dither-props/DitherScrollProgress"
import snapButtonProps from "virtual:dither-props/DitherSnapButton"
import gooeyMenuProps from "virtual:dither-props/DitherGooeyMenu"
import bouncyAccordionProps from "virtual:dither-props/DitherBouncyAccordion"
import expandingArrowProps from "virtual:dither-props/DitherExpandingArrow"
import slideActionProps from "virtual:dither-props/DitherSlideAction"
import holdActionProps from "virtual:dither-props/DitherHoldAction"
import walletCardProps from "virtual:dither-props/DitherWalletCard"
import notificationStackProps from "virtual:dither-props/DitherNotificationStack"
import animatedContentProps from "virtual:dither-props/DitherAnimatedContent"
import fadeContentProps from "virtual:dither-props/DitherFadeContent"
import gradualBlurProps from "virtual:dither-props/DitherGradualBlur"
import starBorderProps from "virtual:dither-props/DitherStarBorder"
import electricBorderProps from "virtual:dither-props/DitherElectricBorder"
import glareHoverProps from "virtual:dither-props/DitherGlareHover"
import magnetProps from "virtual:dither-props/DitherMagnet"
import clickSparkProps from "virtual:dither-props/DitherClickSpark"
import blobCursorProps from "virtual:dither-props/DitherBlobCursor"
import crosshairProps from "virtual:dither-props/DitherCrosshair"
import ghostCursorProps from "virtual:dither-props/DitherGhostCursor"
import splashCursorProps from "virtual:dither-props/DitherSplashCursor"
import targetCursorProps from "virtual:dither-props/DitherTargetCursor"
import pixelTrailProps from "virtual:dither-props/DitherPixelTrail"
import imageTrailProps from "virtual:dither-props/DitherImageTrail"
import metaBallsProps from "virtual:dither-props/DitherMetaBalls"
import metallicPaintProps from "virtual:dither-props/DitherMetallicPaint"
import noiseProps from "virtual:dither-props/DitherNoise"
import cubesProps from "virtual:dither-props/DitherCubes"
import ribbonsProps from "virtual:dither-props/DitherRibbons"
import shapeBlurProps from "virtual:dither-props/DitherShapeBlur"
import strandsProps from "virtual:dither-props/DitherStrands"
import laserFlowProps from "virtual:dither-props/DitherLaserFlow"
import antigravityProps from "virtual:dither-props/DitherAntigravity"
import logoLoopProps from "virtual:dither-props/DitherLogoLoop"
import magicRingsProps from "virtual:dither-props/DitherMagicRings"
import magnetLinesProps from "virtual:dither-props/DitherMagnetLines"
import orbitImagesProps from "virtual:dither-props/DitherOrbitImages"
import pixelTransitionProps from "virtual:dither-props/DitherPixelTransition"
import revealProps from "virtual:dither-props/DitherReveal"
import stickerPeelProps from "virtual:dither-props/DitherStickerPeel"
import DocSection from "../DocSection"
import "./AnimationsDocs.css"

export const API: Record<string, PropRow[]> = {
  stepTiming: [
    { prop: "steps(n, position?)", type: "(p) => number, css-easing-1 step positions", default: '"jump-end"' },
    { prop: "frameSteps(fps, durationMs)", type: "(p) => number, frame(fps) cadence polyfill", default: "" },
    { prop: "frameIndex(elapsedMs, fps)", type: "number: wall-clock frame gate for drivers", default: "" },
    { prop: "cssSteps(n, position?)", type: "string: one config serialized for CSS", default: '"jump-end"' },
    { prop: "DitherAurora frameRate", type: "number (fps)", default: "0 (smooth)" },
  ],
  stage: kitTable(stageProps, {
    join: [
      ["paused", "frameRate"],
      ["as", "class"],
    ],
    // what the stage publishes for CSS
    add: {
      rows: [
        {
          prop: "data-stage / --cq-w / --cq-h",
          type: "playing | directed | paused | still, and the box for CSS",
          default: "",
        },
      ],
    },
  }),
  layer: kitTable(layerProps, {
    join: [
      ["delay", "loop", "yoyo"],
      ["as", "class"],
    ],
    // what the layer writes on its element, and the engine's functions
    add: {
      rows: [
        {
          prop: "style / data-layer",
          type: "transform in the keyframes' own units, opacity, --layer-p and --layer-<name> per property; before | active | done",
          default: "",
        },
        {
          prop: "sampleKeyframes(track, t), keyframeTransform(sample, box?), resolveSample(sample, box), parseLength / termsToCss / termsToPx",
          type: "the engine alone, for your own painters and timelines",
          default: "",
        },
      ],
    },
  }),
  sequences: kitTable(sequenceProps, {
    join: [
      ["duration", "easing"],
      ["loop", "yoyo", "delay"],
      ["paused", "restartOnView", "frameRate"],
      ["restartKey", "onComplete"],
    ],
    // the engine's functions, for a timeline of your own
    add: {
      rows: [
        {
          prop: "planSequence(node | node[])",
          type: "SequencePlan: flatten serial | parallel | stagger | track once",
          default: "",
        },
        {
          prop: "sampleSequence(plan, t)",
          type: "TrackSample[]: { id, index, progress, raw, cycle, state }",
          default: "",
        },
        { prop: "staggerDelay(i, count, each, from)", type: "number: the delay wave, testable alone", default: "" },
      ],
    },
  }),
  containerQueries: kitTable(containerProps, {
    join: [["as", "class"]],
    // the resolver's functions, what the host publishes for CSS and the keyframes it ships
    add: {
      rows: [
        {
          prop: "resolveCq(width, scale?)",
          type: "CqState: the pure resolver (active = highest matching min)",
          default: "CONTAINER_SCALE",
        },
        {
          prop: "quantize(value, step)",
          type: "number: nearest step, never negative; step ≤ 0 is identity",
          default: "",
        },
        {
          prop: "data-cq / --cq-w / --cq-h / --cq-i",
          type: "active bucket attribute + content-box width/height (raw or quantized together) + ordinal, published on the host for CSS",
          default: "",
        },
        {
          prop: "dither-cq-traverse / dither-cq-rise",
          type: "shipped @keyframes: translateX(±100cqw) / translateY(±100cqh); motion measured against the container (small-viewport fallback when none)",
          default: "",
        },
      ],
    },
  }),
  expandTabs: kitTable(expandTabsProps),
  island: kitTable(islandProps, { join: [["compact", "children"]] }),
  cardStack: kitTable(cardStackProps),
  dock: kitTable(dockProps),
  previewRail: kitTable(previewRailProps),
  scrollProgress: kitTable(scrollProgressProps),
  snapButton: kitTable(snapButtonProps),
  gooeyMenu: kitTable(gooeyMenuProps),
  bouncyAccordion: kitTable(bouncyAccordionProps),
  expandingArrow: kitTable(expandingArrowProps),
  slideAction: kitTable(slideActionProps),
  holdAction: kitTable(holdActionProps),
  walletCard: kitTable(walletCardProps, { join: [["balance", "change"]] }),
  notificationStack: kitTable(notificationStackProps),
  animatedContent: kitTable(animatedContentProps),
  fadeContent: kitTable(fadeContentProps),
  gradualBlur: kitTable(gradualBlurProps),
  starBorder: kitTable(starBorderProps),
  electricBorder: kitTable(electricBorderProps),
  glareHover: kitTable(glareHoverProps),
  magnet: kitTable(magnetProps),
  clickSpark: kitTable(clickSparkProps),
  blobCursor: kitTable(blobCursorProps),
  crosshair: kitTable(crosshairProps),
  ghostCursor: kitTable(ghostCursorProps),
  splashCursor: kitTable(splashCursorProps),
  targetCursor: kitTable(targetCursorProps),
  pixelTrail: kitTable(pixelTrailProps),
  imageTrail: kitTable(imageTrailProps),
  metaBalls: kitTable(metaBallsProps),
  metallicPaint: kitTable(metallicPaintProps),
  noise: kitTable(noiseProps),
  cubes: kitTable(cubesProps),
  ribbons: kitTable(ribbonsProps),
  shapeBlur: kitTable(shapeBlurProps),
  strands: kitTable(strandsProps),
  laserFlow: kitTable(laserFlowProps),
  antigravity: kitTable(antigravityProps),
  logoLoop: kitTable(logoLoopProps),
  magicRings: kitTable(magicRingsProps),
  magnetLines: kitTable(magnetLinesProps),
  orbitImages: kitTable(orbitImagesProps),
  pixelTransition: kitTable(pixelTransitionProps),
  ditherReveal: kitTable(revealProps),
  stickerPeel: kitTable(stickerPeelProps),
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
  stepTimingAurora: `{/* the field driver's own knob: stop-motion and fewer uploads */}
<div class="grid grid-cols-2 gap-3">
  {/* smooth, a paint throttle near 30fps */}
  <div class="h-36"><DitherAurora /></div>
  {/* film: paints 8 times a second, holds between */}
  <div class="h-36"><DitherAurora frameRate={8} /></div>
</div>`,
  sequences: `import { DitherSequence, steps } from "@dither-kit"
const [key, setKey] = createSignal(0)
const [waves, setWaves] = createSignal(0)

{/* children wave in from the center, ping-pong three times, quantized; the
     driver writes --seq-p (0 to 1) and data-seq (before, active or done) on
     each child, and each child styles itself from them. planSequence and
     sampleSequence run the same algebra under your own clock */}
<DitherSequence
  stagger={0.07} from="center" duration={0.6}
  loop={3} yoyo easing={steps(4)}
  restartKey={key()} onComplete={() => setWaves(waves() + 1)}
  class="grid grid-cols-6 gap-2"
>
  <For each={Array.from({ length: 12 }, (_, k) => k + 1)}>{(i) => <div class="h-8 rounded bg-foreground" style="opacity: var(--seq-p, 0)" />}</For>
</DitherSequence>
<button type="button" class="mt-3" onClick={() => setKey(key() + 1)}>Replay ({waves()} played)</button>`,
  stage: `<DitherStage duration={8} class="h-56 rounded-lg border">
  {(stage) => (
    <>
      {/* a canvas layer drifts 12% of the stage, at any size */}
      <DitherLayer keyframes={[{ x: '-6cqw' }, { x: '6cqw' }]} duration={8} yoyo loop>
        <DitherAurora colors={['#1f6fd6', '#9ec5ff', '#ffffff']} class="h-full" />
      </DitherLayer>
      {/* SVG parallax */}
      <DitherLayer keyframes={[{ x: 0 }, { x: '-24cqw' }]} duration={8} yoyo loop>
        <svg viewBox="0 0 148 40" preserveAspectRatio="none" class="absolute bottom-0 h-2/5 w-[124%] fill-[#0b1a3a]">
          <path d="M0 40 V30 Q14 22 28 30 T56 24 T84 32 T112 22 T140 30 T148 26 V40 Z" />
        </svg>
      </DitherLayer>
      {/* the moon places its keys with at (seconds or a percentage) */}
      <DitherLayer
        keyframes={[
          { at: 0, x: '80cqw', y: '12cqh', rotate: 0 },
          { at: '50%', easing: 'ease-in-out', rotate: '0.5turn' },
          { x: '20cqw', y: '8cqh', rotate: '1turn' },
        ]}
        duration={8} loop origin="0 0" class="size-7"
      >
        <svg viewBox="0 0 24 24" class="size-7 fill-white"><circle cx="12" cy="12" r="10" /></svg>
      </DitherLayer>
      {/* the same keys, resolved to px for painters */}
      <DitherLayer keyframes={[{ cx: '10cqw', cy: '70cqh' }, { cx: '90cqw', cy: '40cqh' }]} duration={4} yoyo loop>
        {(at) => (
          <svg viewBox={'0 0 ' + Math.max(1, stage.width) + ' ' + Math.max(1, stage.height)} class="size-full">
            <circle cx={at.cx} cy={at.cy} r="4" class="fill-current" />
          </svg>
        )}
      </DitherLayer>
    </>
  )}
</DitherStage>

{/* the engine alone: sampleKeyframes, keyframeTransform and resolveSample
     sample the same keys, write the transform and resolve it to px */}`,
  containerQueries: `import { DitherContainer, quantize } from "@dither-kit"

{/* children read THIS box's width — not the viewport's */}
<DitherContainer
  scale={{ xs: 0, sm: 260, md: 360, lg: 450, xl: 530 }}
  step={8}
  name="card"
  class="cq-card"
>
  {(scope) => (
    <>
      <span class="readout">{scope.size} · {scope.width}px · q8 {quantize(scope.width, 8)}</span>
      <DitherSequence
        stagger={0.03 + scope.index * 0.02}
        from={scope.index >= 3 ? 'center' : 'start'}
        restartKey={scope.size}
        class="cq-grid"
      >
        <For each={Array.from({ length: 12 }, (_, k) => k + 1)}>{(i) => <div class="cell" />}</For>
      </DitherSequence>
    </>
  )}
</DitherContainer>

{/* the stylesheet route, the same scope with zero JS (native @container):
       @container card (min-width: 520px) { .readout { letter-spacing: 0.12em; } }
     the motion route, shipped keyframes that measure the container itself:
       .scan { animation: dither-cq-traverse 2.8s ease-in-out infinite alternate; }
     the selector route, the engine's active bucket on the host element:
       .cq-card[data-cq="xs"] .cell { border-color: #d9a441; }
       .cq-card[data-cq="xl"] .cell { border-color: #3f8ff3; } */}`,
  animatedContent: `<DitherAnimatedContent distance={40} direction="vertical">
  <div class="grid h-28 w-52 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">Slides up on view</div>
</DitherAnimatedContent>`,
  fadeContent: `<DitherFadeContent blur={true}>
  <div class="grid h-28 w-52 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">Fades in on view</div>
</DitherFadeContent>`,
  gradualBlur: `<DitherGradualBlur position="bottom" height={72} strength={5} class="w-64">
  <div class="grid gap-1 text-[13px] text-muted-foreground">
    <For each={Array.from({ length: 6 }, (_, k) => k + 1)}>{(n) => <p>Row {n}: content scrolls under the blur band.</p>}</For>
  </div>
</DitherGradualBlur>`,
  starBorder: `<DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>`,
  electricBorder: `<DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>`,
  glareHover: `<DitherGlareHover>
  <div class="grid h-28 w-52 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">Hover me</div>
</DitherGlareHover>`,
  magnet: `<DitherMagnet strength={0.4}><button>Magnet</button></DitherMagnet>`,
  clickSpark: `<DitherClickSpark color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Click anywhere here
</DitherClickSpark>`,
  blobCursor: `<DitherBlobCursor color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherBlobCursor>`,
  crosshair: `<DitherCrosshair color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherCrosshair>`,
  ghostCursor: `<DitherGhostCursor color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherGhostCursor>`,
  splashCursor: `<DitherSplashCursor color="#3DA5FF" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherSplashCursor>`,
  targetCursor: `<DitherTargetCursor color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherTargetCursor>`,
  pixelTrail: `<DitherPixelTrail color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherPixelTrail>`,
  imageTrail: `<DitherImageTrail class="grid h-44 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
  Move your cursor here
</DitherImageTrail>`,
  metaBalls: `<DitherMetaBalls class="h-64" />`,
  metallicPaint: `<DitherMetallicPaint class="h-64" />`,
  noise: `<DitherNoise class="h-64" />`,
  cubes: `<DitherCubes class="h-64" />`,
  ribbons: `<DitherRibbons class="h-64" />`,
  shapeBlur: `<DitherShapeBlur class="h-64" />`,
  strands: `<DitherStrands class="h-64" />`,
  laserFlow: `<DitherLaserFlow class="h-64" />`,
  antigravity: `<DitherAntigravity class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">Antigravity</DitherAntigravity>`,
  logoLoop: `<DitherLogoLoop items={['DITHER', 'BAYER', 'CANVAS', 'SOLID', 'PIXELS']} />`,
  magicRings: `<DitherMagicRings class="h-52 w-full">
  <span class="grid size-12 place-items-center rounded-full border bg-card text-xs">core</span>
</DitherMagicRings>`,
  magnetLines: `<DitherMagnetLines class="h-52" />`,
  orbitImages: `<DitherOrbitImages items={['A', 'B', 'C', 'D', 'E']} />`,
  pixelTransition: `<DitherPixelTransition color="#181b22" class="grid h-32 w-56 place-items-center rounded-lg border">
  <span class="text-lg">Revealed</span>
</DitherPixelTransition>`,
  ditherReveal: `const [nonce, setNonce] = createSignal(0)

<DitherReveal direction="right" cell={4} duration={1.4} restartKey={nonce()} class="h-32 w-56">
  <div class="grid h-full place-items-center rounded-lg border bg-card text-lg">Revealed</div>
</DitherReveal>
<button type="button" class="mt-3" onClick={() => setNonce(nonce() + 1)}>Replay</button>

{/* or drive it from a timeline: progress (0 to 1) sets the mask, a pure
     function of it; wipeStyle gives any element the same mask */}`,
  stickerPeel: `<DitherStickerPeel>
  <div class="grid h-24 w-40 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">Peel me</div>
</DitherStickerPeel>`,
  expandTabs: `const [tab, setTab] = createSignal("home")

<DitherExpandTabs modelValue={tab()} onUpdateModelValue={setTab} tabs={[
  { value: 'home', label: 'Home' },
  { value: 'library', label: 'Library', color: 'purple' },
  { value: 'alerts', label: 'Alerts', color: 'red' },
]} />  {/* only the active tab unfolds its label */}`,
  island: `const [expanded, setExpanded] = createSignal(false)

<DitherIsland modelValue={expanded()} onUpdateModelValue={setExpanded} label="Deploy running" color="green" live>
  Build 214, lint ok, bundle 84kB, 3 of 5 steps done.  {/* unfolds beneath the pill */}
</DitherIsland>`,
  cardStack: `const cards = [
  { title: "Prints: riso on cream" },
  { title: "Frames: oak 24×30" },
  { title: "Zines: issue 04" },
  { title: "Stickers: die-cut set" },
]
const [top, setTop] = createSignal(0)

{/* drag horizontally, a flick advances, the deck cycles */}
<DitherCardStack items={cards} class="h-40 w-64" onAdvance={(i) => (setTop(i))}>
  {(scope) => (
    <article class="h-full rounded-lg border bg-card p-4">{scope.item.title}</article>
  )}
</DitherCardStack>
<p class="mt-3 text-center text-[10px]">card {top() + 1} of {cards.length}</p>`,
  dock: `const [picked, setPicked] = createSignal("none")

{/* a gaussian magnify around the pointer */}
<DitherDock items={[
  { value: 'home', label: 'Home' },
  { value: 'studio', label: 'Studio', color: 'purple' },
  { value: 'docs', label: 'Docs', color: 'green' },
  { value: 'alerts', label: 'Alerts', color: 'red' },
]} onSelect={(value) => (setPicked(value))} />
<p class="mt-2 text-[10px]">selected: {picked()}</p>`,
  previewRail: `const [dest, setDest] = createSignal("inbox")

{/* ticks pyramid around the pointer, the preview floats beside the rail */}
<DitherPreviewRail modelValue={dest()} onUpdateModelValue={setDest} items={[
  { value: 'inbox', label: 'Inbox', hint: '12 unread threads', color: 'blue' },
  { value: 'drafts', label: 'Drafts', hint: '2 in progress', color: 'purple' },
  { value: 'planner', label: 'Planner', hint: 'Sprint 14, day 3', color: 'green' },
  { value: 'metrics', label: 'Metrics', hint: 'p95 latency 42ms', color: 'orange' },
  { value: 'settings', label: 'Settings', hint: 'Workspace + theme' },
]} />`,
  scrollProgress: `<DitherScrollProgress />                    {/* viewport, fixed top */}
<DitherScrollProgress attach="parent" color="purple" />  {/* nearest scrollable parent */}`,
  snapButton: `const [deploys, setDeploys] = createSignal(0)

{/* a 1:1 drag, rubber-band past the line, the border arms at the threshold;
     release fires snap, and Enter or Space fires without the pull */}
<DitherSnapButton threshold={64} axis="x" color="green" onSnap={() => setDeploys(deploys() + 1)}>
  Pull to deploy
</DitherSnapButton>
<p class="text-[10px]">deploys fired: {deploys()}</p>`,
  gooeyMenu: `const [expanded, setExpanded] = createSignal(false)
const [picked, setPicked] = createSignal("none")

{/* one SVG goo filter fuses the circles while they travel */}
<DitherGooeyMenu modelValue={expanded()} onUpdateModelValue={setExpanded} items={[
  { value: 'add', label: 'Add', color: 'green' },
  { value: 'export', label: 'Export', color: 'blue' },
  { value: 'share', label: 'Share', color: 'purple' },
]} direction="up" onSelect={(value) => (setPicked(value))} />
<p class="mt-3 text-[10px]">picked: {picked()}</p>`,
  bouncyAccordion: `const [panel, setPanel] = createSignal("overview")

{/* single-open: a spring overshoot on open, a brisk close */}
<DitherBouncyAccordion modelValue={panel()} onUpdateModelValue={setPanel} items={[
  { value: 'overview', label: 'Overview', hint: 'What shipped this week', icon: '▤',
    content: 'Charts, buttons and backgrounds now share one Bayer engine.' },
  { value: 'activity', label: 'Activity', hint: '3 deploys, 1 rollback', icon: '◷', color: 'green',
    content: 'Build 214 settled after a weighted spring: 8% overshoot, then calm.' },
  { value: 'alerts', label: 'Alerts', hint: 'One flapping check', icon: '◈', color: 'orange',
    content: 'p95 latency wobbled at 04:00 and snapped back on its own.' },
]} />`,
  expandingArrow: `{/* a dotted trail unrolls on hover or focus */}
<DitherExpandingArrow color="blue">Explore the kit</DitherExpandingArrow>`,
  slideAction: `const [deploys, setDeploys] = createSignal(0)

{/* a 1:1 thumb drag where flick momentum counts; an early release springs
     back, and Enter or Space confirms without the slide */}
<DitherSlideAction label="Slide to deploy" color="green" onConfirm={() => setDeploys(deploys() + 1)} />
<p class="text-[10px]">deploys: {deploys()}</p>`,
  holdAction: `const [completed, setCompleted] = createSignal(0)

{/* a liquid fill with a dotted crest; release early to drain */}
<DitherHoldAction duration={1200} direction="vertical" color="orange" onComplete={() => setCompleted(completed() + 1)}>
  Hold to purge cache
</DitherHoldAction>
<p class="text-[10px]">completed: {completed()}</p>`,
  walletCard: `const [account, setAccount] = createSignal("main")
const [last, setLast] = createSignal("none")

{/* the switcher and search morph from their triggers, the digits cascade,
     privacy masks the balance, copying the address answers with a check */}
<DitherWalletCard modelValue={account()} onUpdateModelValue={setAccount} accounts={[
  { value: 'main', label: 'Main', address: '0x7f3a9c2e14b7d55aa93d', balance: 12480.52, change: 2.4 },
  { value: 'savings', label: 'Savings', address: '0x8b21e0c4a6f9d1327e55', balance: 8210.11, change: -1.1, color: 'purple' },
  { value: 'trading', label: 'Trading', address: '0x91cc4db2e87a30f6b214', balance: 3033.7, change: 0.6, color: 'orange' },
]} recent={['gas fees', 'swap history']} notifications
  onAction={(name) => (setLast(name))} onSubmit={(query) => (setLast('search: ' + query))}
  onNotify={() => setLast('notifications')} class="w-full max-w-80" />
<p class="text-[10px]">last: {last()}</p>`,
}

const cardBox =
  "grid h-28 w-52 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground"
const cursorArea =
  "grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground"
const canvasBox = "h-64 w-full overflow-hidden rounded-lg border border-border/60"

const STACK_CARDS = [
  { title: "Prints: riso on cream", color: "purple" },
  { title: "Frames: oak 24×30", color: "blue" },
  { title: "Zines: issue 04", color: "green" },
  { title: "Stickers: die-cut set", color: "orange" },
] as { title: string; color: "purple" | "blue" | "green" | "orange" }[]
const STACK_VARIANTS = ["stack", "fan", "condensed"] as const
const stackChip = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`
const WALLET_ACCOUNTS = [
  { value: "main", label: "Main", address: "0x7f3a9c2e14b7d55aa93d", balance: 12480.52, change: 2.4 },
  {
    value: "savings",
    label: "Savings",
    address: "0x8b21e0c4a6f9d1327e55",
    balance: 8210.11,
    change: -1.1,
    color: "purple",
  },
  {
    value: "trading",
    label: "Trading",
    address: "0x91cc4db2e87a30f6b214",
    balance: 3033.7,
    change: 0.6,
    color: "orange",
  },
] as { value: string; label: string; address: string; balance: number; change: number; color?: "purple" | "orange" }[]

/** 1..n, what a `v-for="i in n"` walked. */
const count = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

export default function AnimationsDocs() {
  /* Skiper-adjacent widgets: working demo state. */
  const [expandTab, setExpandTab] = createSignal("home")
  const [revealDirection, setRevealDirection] = createSignal<"none" | "right" | "down" | "iris">("none")
  const [revealNonce, setRevealNonce] = createSignal(0)
  const replayReveal = (direction: "none" | "right" | "down" | "iris") => {
    setRevealDirection(direction)
    setRevealNonce((n) => n + 1)
  }
  const [islandOpen, setIslandOpen] = createSignal(false)
  const [stackIndex, setStackIndex] = createSignal(0)
  const [dockPick, setDockPick] = createSignal("none")
  const [railDest, setRailDest] = createSignal("inbox")
  const [snapCount, setSnapCount] = createSignal(0)
  const [gooeyOpen, setGooeyOpen] = createSignal(false)
  const [bouncyPanel, setBouncyPanel] = createSignal("overview")
  const [slideCount, setSlideCount] = createSignal(0)
  const [holdCount, setHoldCount] = createSignal(0)
  const [walletAccount, setWalletAccount] = createSignal("main")
  const [walletNote, setWalletNote] = createSignal("none")
  const [stackPinned, setStackPinned] = createSignal(false)
  const [stackNote, setStackNote] = createSignal("none")
  const [stackVariant, setStackVariant] = createSignal<(typeof STACK_VARIANTS)[number]>("stack")
  const stackSnippet = createMemo(
    () => `const [pinned, setPinned] = createSignal(false)
const [last, setLast] = createSignal("none")

<DitherNotificationStack modelValue={pinned()} onUpdateModelValue={setPinned}${stackVariant() === "stack" ? "" : ` variant="${stackVariant()}"`} items={[
  { id: 'n1', title: 'Deploy finished', body: 'dither-ui shipped to production in 42s', time: '2m', icon: '↑', color: 'green' },
  { id: 'n2', title: 'New comment', body: 'Rei: “the drum snaps beautifully”', time: '16m', icon: '▤', color: 'blue' },
  { id: 'n3', title: 'Build warning', body: 'chunk index.js is 447 kB', time: '1h', icon: '◈', color: 'orange' },
]} onViewall={() => setLast('view all')} />
<p class="text-[10px]">pinned: {pinned()}, last: {last()}</p>
{/* stacked summary → readable list on hover, focus or tap · tap pins ·
     spring fan-out with per-card stagger */}`,
  )
  const [gooeyPick, setGooeyPick] = createSignal("none")
  // Sequence demo: control changes double as restart keys — the plan rebuilds
  // and replays whenever origin, easing or the replay nonce shifts.
  const [seqFrom, setSeqFrom] = createSignal<StaggerFrom>("center")
  const [seqQuant, setSeqQuant] = createSignal(false)
  const [seqNonce, setSeqNonce] = createSignal(0)
  const seqEasing = createMemo(() => (seqQuant() ? steps(4) : linear))
  const seqKey = createMemo(() => `${String(seqFrom())}|${seqQuant()}|${seqNonce()}`)
  // Container demo: the panel is a native resize box; steppers are its
  // keyboard path (both feed the same ResizeObserver the engine listens to).
  // The Solid DitherContainer hands out no element, so a stepper finds the
  // panel as the element after its own row.
  const [stageWidth, setStageWidth] = createSignal(100)
  function nudgeCq(stepper: HTMLElement, delta: number): void {
    const host = stepper.parentElement?.nextElementSibling as HTMLElement | null | undefined
    if (!host) return
    const w = Math.round(host.getBoundingClientRect().width)
    host.style.width = `${Math.min(580, Math.max(200, w + delta))}px`
  }
  // The Solid DitherStage takes no style, so the stage's width is written on
  // its element: the one after the row that holds the slider.
  const widen = (row: HTMLElement) =>
    createEffect(() => {
      const width = `${stageWidth()}%`
      const stage = row.nextElementSibling
      if (stage instanceof HTMLElement) stage.style.width = width
    })

  return (
    <>
      {/* Animated content */}
      <DocSection id="animated-content">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Wrap anything to have it slide and fade into place the first time it enters the viewport. Direction, distance
          and timing are configurable, and <code class="text-foreground/80">distance</code> takes CSS lengths too:{" "}
          <code class="text-foreground/80">distance="4cqw"</code> reveals from 4% of the nearest query container, so the
          motion measures its parent instead of pixels.
        </p>
        <DemoCard code={SNIPPETS.animatedContent}>
          <DitherAnimatedContent distance={40}>
            <div class={cardBox}>Slides up on view</div>
          </DitherAnimatedContent>
        </DemoCard>
        <PropsTable rows={API.animatedContent} />
      </DocSection>

      {/* Fade content */}
      <DocSection id="fade-content">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pure fade-in on view, optionally de-blurring as it appears. The lighter cousin of Animated content when you
          only want opacity.
        </p>
        <DemoCard code={SNIPPETS.fadeContent}>
          <DitherFadeContent blur={true}>
            <div class={cardBox}>Fades in on view</div>
          </DitherFadeContent>
        </DemoCard>
        <PropsTable rows={API.fadeContent} />
      </DocSection>

      {/* Gradual blur */}
      <DocSection id="gradual-blur">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A masked <code class="text-foreground/80">backdrop-filter</code> strip that progressively blurs toward an
          edge: the iOS-style soft fade over a scroll region.
        </p>
        <DemoCard code={SNIPPETS.gradualBlur}>
          <DitherGradualBlur position="bottom" height={72} strength={5} class="w-64">
            <div class="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
              <For each={count(6)}>{(n) => <p>Row {n}: content scrolls under the blur band.</p>}</For>
            </div>
          </DitherGradualBlur>
        </DemoCard>
        <PropsTable rows={API.gradualBlur} />
      </DocSection>

      {/* Star border */}
      <DocSection id="star-border">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rounded frame with two bright glints traveling its top and bottom edges: a subtle animated outline for a CTA
          or badge.
        </p>
        <DemoCard code={SNIPPETS.starBorder}>
          <DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>
        </DemoCard>
        <PropsTable rows={API.starBorder} />
      </DocSection>

      {/* Electric border */}
      <DocSection id="electric-border">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An SVG turbulence filter jitters the frame edge into a crackling electric outline. Reduced motion drops the
          displacement.
        </p>
        <DemoCard code={SNIPPETS.electricBorder}>
          <DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>
        </DemoCard>
        <PropsTable rows={API.electricBorder} />
      </DocSection>

      {/* Glare hover */}
      <DocSection id="glare-hover">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A diagonal sheen sweeps across the surface on hover: the glossy-card reflection, done with a single masked
          gradient. Hover the card.
        </p>
        <DemoCard code={SNIPPETS.glareHover}>
          <DitherGlareHover>
            <div class={cardBox}>Hover me</div>
          </DitherGlareHover>
        </DemoCard>
        <PropsTable rows={API.glareHover} />
      </DocSection>

      {/* Magnet */}
      <DocSection id="magnet">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The wrapped element is pulled toward the pointer while it is within range, easing back when the cursor leaves.
          Move your cursor near the button.
        </p>
        <DemoCard code={SNIPPETS.magnet}>
          <DitherMagnet strength={0.4}>
            <button type="button" class="rounded-md border border-border/60 bg-card px-4 py-2 text-sm">
              Magnet
            </button>
          </DitherMagnet>
        </DemoCard>
        <PropsTable rows={API.magnet} />
      </DocSection>

      {/* Click spark */}
      <DocSection id="click-spark">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A burst of spark lines radiates from every click inside the area, drawn on a lightweight canvas overlay. Click
          anywhere in the preview.
        </p>
        <DemoCard code={SNIPPETS.clickSpark}>
          <DitherClickSpark
            color="#7CFF67"
            class="grid h-40 w-full place-items-center rounded-lg border border-border/60"
          >
            <span class="text-sm text-muted-foreground">Click anywhere here</span>
          </DitherClickSpark>
        </DemoCard>
        <PropsTable rows={API.clickSpark} />
      </DocSection>

      {/* Blob cursor */}
      <DocSection id="blob-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A soft, screen-blended blob eases toward the pointer inside the area: a gooey cursor companion. Move your
          cursor over the box.
        </p>
        <DemoCard code={SNIPPETS.blobCursor}>
          <DitherBlobCursor class={cursorArea}>Move your cursor here</DitherBlobCursor>
        </DemoCard>
        <PropsTable rows={API.blobCursor} />
      </DocSection>

      {/* Crosshair */}
      <DocSection id="crosshair">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Full-height and full-width guide lines track the pointer across the area: a precision reticle. Move your
          cursor over the box.
        </p>
        <DemoCard code={SNIPPETS.crosshair}>
          <DitherCrosshair class={cursorArea}>Move your cursor here</DitherCrosshair>
        </DemoCard>
        <PropsTable rows={API.crosshair} />
      </DocSection>

      {/* Ghost cursor */}
      <DocSection id="ghost-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A tapering trail of fading dots chases the pointer on a canvas overlay. Move your cursor over the box.
        </p>
        <DemoCard code={SNIPPETS.ghostCursor}>
          <DitherGhostCursor class={cursorArea}>Move your cursor here</DitherGhostCursor>
        </DemoCard>
        <PropsTable rows={API.ghostCursor} />
      </DocSection>

      {/* Splash cursor */}
      <DocSection id="splash-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Expanding ripple rings bloom along the pointer path, like drops on water. Move your cursor over the box.
        </p>
        <DemoCard code={SNIPPETS.splashCursor}>
          <DitherSplashCursor class={cursorArea}>Move your cursor here</DitherSplashCursor>
        </DemoCard>
        <PropsTable rows={API.splashCursor} />
      </DocSection>

      {/* Target cursor */}
      <DocSection id="target-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A slowly rotating corner-bracket reticle locks onto the pointer: a HUD targeting frame. Move your cursor over
          the box.
        </p>
        <DemoCard code={SNIPPETS.targetCursor}>
          <DitherTargetCursor class={cursorArea}>Move your cursor here</DitherTargetCursor>
        </DemoCard>
        <PropsTable rows={API.targetCursor} />
      </DocSection>

      {/* Pixel trail */}
      <DocSection id="pixel-trail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The pointer lights up cells of a pixel grid that then fade back out: a glowing wake across the lattice. Move
          your cursor over the box.
        </p>
        <DemoCard code={SNIPPETS.pixelTrail}>
          <DitherPixelTrail class={cursorArea}>Move your cursor here</DitherPixelTrail>
        </DemoCard>
        <PropsTable rows={API.pixelTrail} />
      </DocSection>

      {/* Image trail */}
      <DocSection id="image-trail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Tiles from a palette drop along the pointer path, rotating and shrinking as they fade. Pass real image URLs
          via <code class="text-foreground/80">colors</code> swapped for tiles here. Move your cursor over the box.
        </p>
        <DemoCard code={SNIPPETS.imageTrail}>
          <DitherImageTrail class="grid h-44 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
            Move your cursor here
          </DitherImageTrail>
        </DemoCard>
        <PropsTable rows={API.imageTrail} />
      </DocSection>

      {/* Meta balls */}
      <DocSection id="meta-balls">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Orbiting blobs fuse into a gooey metaball iso-surface, tinted and ordered-dithered through the kit engine. The
          pointer adds a blob.
        </p>
        <DemoCard code={SNIPPETS.metaBalls}>
          <div class={canvasBox}>
            <DitherMetaBalls />
          </div>
        </DemoCard>
        <PropsTable rows={API.metaBalls} />
      </DocSection>

      {/* Metallic paint */}
      <DocSection id="metallic-paint">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Iterative domain-warped reflections read as flowing liquid chrome. Fully opaque, dithered across a metallic
          ramp.
        </p>
        <DemoCard code={SNIPPETS.metallicPaint}>
          <div class={canvasBox}>
            <DitherMetallicPaint />
          </div>
        </DemoCard>
        <PropsTable rows={API.metallicPaint} />
      </DocSection>

      {/* Noise */}
      <DocSection id="noise">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Animated hashed grain thresholded against the Bayer matrix: living static for a texture overlay. Tune{" "}
          <code class="text-foreground/80">density</code> and blend it over content.
        </p>
        <DemoCard code={SNIPPETS.noise}>
          <div class={canvasBox}>
            <DitherNoise />
          </div>
        </DemoCard>
        <PropsTable rows={API.noise} />
      </DocSection>

      {/* Cubes */}
      <DocSection id="cubes">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rhombille tiling shades into a field of isometric cubes, each face lit and pulsing on noise. Tinted and
          ordered-dithered.
        </p>
        <DemoCard code={SNIPPETS.cubes}>
          <div class={canvasBox}>
            <DitherCubes />
          </div>
        </DemoCard>
        <PropsTable rows={API.cubes} />
      </DocSection>

      {/* Ribbons */}
      <DocSection id="ribbons">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Thick flowing bands ride wavy fbm centerlines, bright at the core and tinted per ribbon. The pointer bends
          nearby ribbons toward it.
        </p>
        <DemoCard code={SNIPPETS.ribbons}>
          <div class={canvasBox}>
            <DitherRibbons />
          </div>
        </DemoCard>
        <PropsTable rows={API.ribbons} />
      </DocSection>

      {/* Shape blur */}
      <DocSection id="shape-blur">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A big soft blob morphs on noise and drifts toward the pointer: a gentle out-of-focus shape. Move your cursor
          over it.
        </p>
        <DemoCard code={SNIPPETS.shapeBlur}>
          <div class={canvasBox}>
            <DitherShapeBlur />
          </div>
        </DemoCard>
        <PropsTable rows={API.shapeBlur} />
      </DocSection>

      {/* Strands */}
      <DocSection id="strands">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dozens of thin filaments sway on fbm like blown hair, tinted by depth and ordered-dithered with transparent
          gaps.
        </p>
        <DemoCard code={SNIPPETS.strands}>
          <div class={canvasBox}>
            <DitherStrands />
          </div>
        </DemoCard>
        <PropsTable rows={API.strands} />
      </DocSection>

      {/* Laser flow */}
      <DocSection id="laser-flow">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sharp horizontal beams sweep with additive bloom and a faint jitter, tinted per beam: a scanning laser array.
        </p>
        <DemoCard code={SNIPPETS.laserFlow}>
          <div class={canvasBox}>
            <DitherLaserFlow />
          </div>
        </DemoCard>
        <PropsTable rows={API.laserFlow} />
      </DocSection>

      {/* Antigravity */}
      <DocSection id="antigravity">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A field of motes drifts upward and wraps: gravity in reverse, layered behind your content.
        </p>
        <DemoCard code={SNIPPETS.antigravity}>
          <DitherAntigravity class={cursorArea}>Antigravity</DitherAntigravity>
        </DemoCard>
        <PropsTable rows={API.antigravity} />
      </DocSection>

      {/* Logo loop */}
      <DocSection id="logo-loop">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A seamless infinite marquee of items. Pass logos or wordmarks and it loops forever with a measured wrap.
        </p>
        <DemoCard code={SNIPPETS.logoLoop}>
          <div class="w-full text-xl font-medium tracking-tight text-muted-foreground">
            <DitherLogoLoop items={["DITHER", "BAYER", "CANVAS", "SOLID", "PIXELS"]} />
          </div>
        </DemoCard>
        <PropsTable rows={API.logoLoop} />
      </DocSection>

      {/* Magic rings */}
      <DocSection id="magic-rings">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Concentric rings pulse outward from the center on a stagger: a radar-ping halo around whatever you wrap.
        </p>
        <DemoCard code={SNIPPETS.magicRings}>
          <DitherMagicRings class="h-52 w-full">
            <span class="grid h-12 w-12 place-items-center rounded-full border border-border/60 bg-card text-xs text-muted-foreground">
              core
            </span>
          </DitherMagicRings>
        </DemoCard>
        <PropsTable rows={API.magicRings} />
      </DocSection>

      {/* Magnet lines */}
      <DocSection id="magnet-lines">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A grid of little needles all swivel to point at the pointer, like iron filings over a magnet. Move your cursor
          over the box.
        </p>
        <DemoCard code={SNIPPETS.magnetLines}>
          <DitherMagnetLines class={cursorArea} />
        </DemoCard>
        <PropsTable rows={API.magnetLines} />
      </DocSection>

      {/* Orbit images */}
      <DocSection id="orbit-images">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Items ride a circular orbit around a center point. Pass avatars, logos or labels. Counter-rotated so they stay
          upright.
        </p>
        <DemoCard code={SNIPPETS.orbitImages}>
          <div class="grid min-h-56 place-items-center">
            <DitherOrbitImages items={["A", "B", "C", "D", "E"]} />
          </div>
        </DemoCard>
        <PropsTable rows={API.orbitImages} />
      </DocSection>

      {/* Pixel transition */}
      <DocSection id="pixel-transition">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A grid of pixel cells covers the content and dissolves in a scattered order on hover, revealing what is
          underneath. Hover the card.
        </p>
        <DemoCard code={SNIPPETS.pixelTransition}>
          <DitherPixelTransition
            class="grid h-32 w-56 place-items-center rounded-lg border border-border/60"
            color="#181b22"
          >
            <span class="text-lg tracking-tight">Revealed</span>
          </DitherPixelTransition>
        </DemoCard>
        <PropsTable rows={API.pixelTransition} />
      </DocSection>

      {/* Dither reveal */}
      <DocSection id="dither-reveal">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Any content comes in through an ordered-dither mask. A dissolve resolves cell by cell in the Bayer order; a
          wipe moves a solid front with a dithered band behind it. The mask is a pure function of progress, so a seeked
          frame (the player, a video export) gets the same cells every time, and the Studio's reels cut between frames
          with it. Pass <code class="text-foreground/80">progress</code> to drive it from your own timeline.
        </p>
        <DemoCard code={SNIPPETS.ditherReveal}>
          <div class="flex flex-col items-center gap-3">
            <DitherReveal
              direction={revealDirection()}
              cell={4}
              duration={1.4}
              restartKey={revealNonce()}
              class="h-32 w-56"
            >
              <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card">
                <span class="text-lg tracking-tight">Revealed</span>
              </div>
            </DitherReveal>
            <div class="flex flex-wrap items-center gap-2">
              <For
                each={
                  [
                    ["none", "Dissolve"],
                    ["right", "Wipe right"],
                    ["down", "Wipe down"],
                    ["iris", "Iris"],
                  ] as const
                }
              >
                {(opt) => (
                  <button
                    type="button"
                    class={`rounded border px-2 py-1 text-[11px] ${
                      revealDirection() === opt[0]
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border/60 text-muted-foreground hover:bg-accent/40"
                    }`}
                    aria-pressed={revealDirection() === opt[0]}
                    onClick={() => replayReveal(opt[0])}
                  >
                    {opt[1]}
                  </button>
                )}
              </For>
              <button
                type="button"
                class="rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
                onClick={() => setRevealNonce((n) => n + 1)}
              >
                Replay
              </button>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.ditherReveal} />
      </DocSection>

      {/* Page transition */}
      <TransitionSection />

      {/* Sticker peel */}
      <DocSection id="sticker-peel">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A corner of the card peels up on hover with a soft curl shadow: the sticker lift. Hover the card.
        </p>
        <DemoCard code={SNIPPETS.stickerPeel}>
          <DitherStickerPeel>
            <div class="grid h-24 w-40 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground">
              Peel me
            </div>
          </DitherStickerPeel>
        </DemoCard>
        <PropsTable rows={API.stickerPeel} />
      </DocSection>

      <DocSection id="expand-tabs">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An icon bar where only the active tab unfolds its label. The rest stay square glyphs. The label slides through
          the house 0fr grid trick.
        </p>
        <DemoCard code={SNIPPETS.expandTabs}>
          <div class="grid min-h-24 place-items-center">
            <DitherExpandTabs
              modelValue={expandTab()}
              onUpdateModelValue={setExpandTab}
              tabs={[
                { value: "home", label: "Home" },
                { value: "library", label: "Library", color: "purple" },
                { value: "alerts", label: "Alerts", color: "red" },
              ]}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.expandTabs} />
      </DocSection>

      <DocSection id="island">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A morphing status pill: the compact row keeps its pulse while the detail unfolds beneath. Escape collapses;
          reduced motion snaps.
        </p>
        <DemoCard code={SNIPPETS.island}>
          <div class="grid min-h-28 place-items-center">
            <DitherIsland
              modelValue={islandOpen()}
              onUpdateModelValue={setIslandOpen}
              label="Deploy running"
              color="green"
              live
              class="w-64"
            >
              Build 214, lint ok, bundle 84kB, 3 of 5 steps done.
            </DitherIsland>
          </div>
        </DemoCard>
        <PropsTable rows={API.island} />
      </DocSection>

      <DocSection id="card-stack">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A swipe deck on the kit's own gesture math: 1:1 tracking, rubber-band past the edge, a flick or a far drag
          sends the card flying and the stack rises. Drag the top card.
        </p>
        <DemoCard code={SNIPPETS.cardStack}>
          <div class="grid min-h-56 place-items-center">
            <div>
              <DitherCardStack items={STACK_CARDS} class="h-40 w-64" onAdvance={setStackIndex}>
                {(card) => (
                  <article class="flex h-full flex-col justify-between rounded-lg border border-border/60 bg-card/90 p-4">
                    <span
                      class="size-2 rounded-[2px]"
                      style={{ background: `var(--swatch-${card.item.color})` }}
                      aria-hidden="true"
                    />
                    <p class="font-mono text-[13px] text-foreground">{card.item.title}</p>
                  </article>
                )}
              </DitherCardStack>
              <p class="mt-3 text-center text-[10px] tabular-nums text-muted-foreground">
                card {stackIndex() + 1} of {STACK_CARDS.length}
              </p>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.cardStack} />
      </DocSection>

      <DocSection id="dock">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A hover-magnifying dock: items swell on a gaussian falloff around the pointer and settle when it leaves.
          Reduced motion keeps the row still.
        </p>
        <DemoCard code={SNIPPETS.dock}>
          <div class="grid min-h-28 place-items-end justify-center pb-2">
            <div class="text-center">
              <DitherDock
                items={[
                  { value: "home", label: "Home" },
                  { value: "studio", label: "Studio", color: "purple" },
                  { value: "docs", label: "Docs", color: "green" },
                  { value: "alerts", label: "Alerts", color: "red" },
                ]}
                onSelect={setDockPick}
              />
              <p class="mt-2 text-[10px] text-muted-foreground">selected: {dockPick()}</p>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.dock} />
      </DocSection>

      <DocSection id="preview-rail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A Codex app-inspired navigation rail: compact ticks form a pyramid around the pointer and reveal a floating
          destination preview beside the rail. Keyboard focus previews too; reduced motion keeps the ticks still.
        </p>
        <DemoCard code={SNIPPETS.previewRail}>
          <div class="flex min-h-56 items-center justify-start pl-6">
            <DitherPreviewRail
              modelValue={railDest()}
              onUpdateModelValue={setRailDest}
              items={[
                { value: "inbox", label: "Inbox", hint: "12 unread threads", color: "blue" },
                { value: "drafts", label: "Drafts", hint: "2 in progress", color: "purple" },
                { value: "planner", label: "Planner", hint: "Sprint 14, day 3", color: "green" },
                { value: "metrics", label: "Metrics", hint: "p95 latency 42ms", color: "orange" },
                { value: "settings", label: "Settings", hint: "Workspace + theme" },
              ]}
            />
            <p class="ml-10 text-[10px] text-muted-foreground">destination: {railDest()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.previewRail} />
      </DocSection>

      <DocSection id="scroll-progress">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Reading progress as a dithered bar. It composes DitherProgress and rides the viewport edge, or the top of any
          scrollable parent. Scroll the box.
        </p>
        <DemoCard code={SNIPPETS.scrollProgress}>
          <div class="relative mx-auto h-48 max-w-md overflow-y-auto rounded-lg border border-border/60">
            <DitherScrollProgress attach="parent" color="purple" />
            <div class="grid gap-2 p-4" aria-hidden="true">
              <For each={count(14)}>
                {(i) => <div class={`h-2 rounded-sm bg-border/50 ${i % 3 === 0 ? "w-2/3" : "w-full"}`} />}
              </For>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.scrollProgress} />
      </DocSection>

      <DocSection id="snap-button">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Pull to confirm: drag past the line and the border arms; release fires and the button springs home. Short
          pulls just spring. Enter and Space fire without the pull; reduced motion skips the spring.
        </p>
        <DemoCard code={SNIPPETS.snapButton}>
          <div class="grid min-h-28 place-items-center gap-3">
            <DitherSnapButton threshold={64} axis="x" color="green" onSnap={() => setSnapCount((n) => n + 1)}>
              Pull to deploy
            </DitherSnapButton>
            <p class="text-[10px] tabular-nums text-muted-foreground">deploys fired: {snapCount()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.snapButton} />
      </DocSection>

      <DocSection id="gooey-menu">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Actions that melt out of one trigger: an SVG goo filter fuses the circles while they travel, then they settle
          apart. Escape collapses; reduced motion drops the travel.
        </p>
        <DemoCard code={SNIPPETS.gooeyMenu}>
          <div class="grid min-h-64 place-items-end justify-center pb-4">
            <div class="text-center">
              <DitherGooeyMenu
                modelValue={gooeyOpen()}
                onUpdateModelValue={setGooeyOpen}
                direction="up"
                items={[
                  { value: "add", label: "Add", color: "green" },
                  { value: "export", label: "Export", color: "blue" },
                  { value: "share", label: "Share", color: "purple" },
                ]}
                onSelect={setGooeyPick}
              />
              <p class="mt-3 text-[10px] text-muted-foreground">picked: {gooeyPick()}</p>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.gooeyMenu} />
      </DocSection>

      <DocSection id="bouncy-accordion">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A single-open accordion with a weighted spring layout: panels overshoot and settle on a sampled damped-spring
          easing, icon rows lead each header, and content rises into view. Reduced motion reveals instantly.
        </p>
        <DemoCard code={SNIPPETS.bouncyAccordion}>
          <DitherBouncyAccordion
            modelValue={bouncyPanel()}
            onUpdateModelValue={setBouncyPanel}
            class="mx-auto max-w-sm"
            items={[
              {
                value: "overview",
                label: "Overview",
                hint: "What shipped this week",
                icon: "▤",
                content: "Charts, buttons and backgrounds now share one Bayer engine.",
              },
              {
                value: "activity",
                label: "Activity",
                hint: "3 deploys, 1 rollback",
                icon: "◷",
                color: "green",
                content: "Build 214 settled after a weighted spring: 8% overshoot, then calm.",
              },
              {
                value: "alerts",
                label: "Alerts",
                hint: "One flapping check",
                icon: "◈",
                color: "orange",
                content: "p95 latency wobbled at 04:00 and snapped back on its own.",
              },
            ]}
          />
        </DemoCard>
        <PropsTable rows={API.bouncyAccordion} />
      </DocSection>

      <DocSection id="expanding-arrow">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An accent tile that expands into a dotted-arrow trail on hover or focus. The trail is stamped from the same
          accent hue. Reduced motion reveals it instantly.
        </p>
        <DemoCard code={SNIPPETS.expandingArrow}>
          <div class="flex min-h-24 items-center justify-center">
            <DitherExpandingArrow color="blue">Explore the kit</DitherExpandingArrow>
          </div>
        </DemoCard>
        <PropsTable rows={API.expandingArrow} />
      </DocSection>

      <DocSection id="slide-action">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Drag the thumb to the end of the track to confirm (flick momentum counts), or release early and it springs
          back. Enter or Space confirms without the slide.
        </p>
        <DemoCard code={SNIPPETS.slideAction}>
          <div class="flex min-h-24 flex-col items-center justify-center gap-3">
            <DitherSlideAction label="Slide to deploy" color="green" onConfirm={() => setSlideCount((n) => n + 1)} />
            <p class="font-mono text-[10px] text-muted-foreground">deploys: {slideCount()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.slideAction} />
      </DocSection>

      <DocSection id="hold-action">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Hold to complete: a liquid fill with a dotted crest rises (or slides) while you press; release early and it
          drains back. A held Enter or Space works the same way.
        </p>
        <DemoCard code={SNIPPETS.holdAction}>
          <div class="flex min-h-24 flex-col items-center justify-center gap-3">
            <div class="flex items-center gap-4">
              <DitherHoldAction color="orange" onComplete={() => setHoldCount((n) => n + 1)}>
                Hold to purge cache
              </DitherHoldAction>
              <DitherHoldAction
                direction="horizontal"
                color="red"
                duration={900}
                onComplete={() => setHoldCount((n) => n + 1)}
              >
                Hold to delete
              </DitherHoldAction>
            </div>
            <p class="font-mono text-[10px] text-muted-foreground">completed: {holdCount()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.holdAction} />
      </DocSection>

      <DocSection id="wallet-card">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A wallet overview card: the account switcher and search morph open from their triggers (recents listed in the
          panel), the balance cascades in with a change pill and privacy toggle, the address copies with feedback, the
          bell carries an unread pulse, and Send / Deposit / Swap / Buy report through one event.
        </p>
        <DemoCard code={SNIPPETS.walletCard}>
          <div class="flex min-h-72 flex-col items-center justify-center gap-3">
            <DitherWalletCard
              modelValue={walletAccount()}
              onUpdateModelValue={setWalletAccount}
              accounts={WALLET_ACCOUNTS}
              recent={["gas fees", "swap history"]}
              notifications
              onAction={setWalletNote}
              onSubmit={(query) => setWalletNote("search: " + query)}
              onNotify={() => setWalletNote("notifications")}
              class="w-full max-w-80"
            />
            <p class="font-mono text-[10px] text-muted-foreground">last: {walletNote()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.walletCard} />
      </DocSection>

      <DocSection id="notification-stack">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Compact notification cards that spring from a stacked summary into a readable list on hover, focus or tap. Tap
          pins the list open, and the view-all row appears with the expansion. Reduced motion snaps.
        </p>
        <DemoCard code={stackSnippet()}>
          <div class="flex min-h-72 flex-col items-center justify-center gap-4">
            <DitherNotificationStack
              modelValue={stackPinned()}
              onUpdateModelValue={setStackPinned}
              variant={stackVariant()}
              items={[
                {
                  id: "n1",
                  title: "Deploy finished",
                  body: "dither-ui shipped to production in 42s",
                  time: "2m",
                  icon: "↑",
                  color: "green",
                },
                {
                  id: "n2",
                  title: "New comment",
                  body: "Rei: “the drum snaps beautifully”",
                  time: "16m",
                  icon: "▤",
                  color: "blue",
                },
                {
                  id: "n3",
                  title: "Build warning",
                  body: "chunk index.js is 447 kB",
                  time: "1h",
                  icon: "◈",
                  color: "orange",
                },
              ]}
              onViewall={() => setStackNote("view all")}
            />
            <p class="font-mono text-[10px] text-muted-foreground">
              pinned: {String(stackPinned())}, last: {stackNote()}
            </p>
          </div>
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-3 flex gap-1">
          <For each={STACK_VARIANTS}>
            {(v) => (
              <button
                type="button"
                aria-pressed={stackVariant() === v}
                class={stackChip(stackVariant() === v)}
                onClick={() => setStackVariant(v)}
              >
                {v}
              </button>
            )}
          </For>
        </div>
        <PropsTable rows={API.notificationStack} />
      </DocSection>

      {/* Step timing */}
      <DocSection id="step-timing" class="animations-docs-scope">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Quantized time for a quantized renderer: <code class="text-foreground/80">steps()</code> samples progress
          instead of interpolating it, the temporal twin of the Bayer threshold. One keyframe run, three clocks: smooth,
          six-step (both endpoints visible), three-step (the end value lands only on the last frame).
        </p>
        <DemoCard code={SNIPPETS.stepTiming}>
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
          The kit's shared field runtime takes the same idea down at the driver layer:{" "}
          <code class="text-foreground/80">frameRate</code> paints only on wall-time boundaries and holds the raster
          between them: stop-motion <i>and</i> fewer buffer uploads. Two Auroras, same clock source, different cadence.
        </p>
        <DemoCard code={SNIPPETS.stepTimingAurora}>
          <div class="grid grid-cols-2 gap-3">
            <div class="overflow-hidden rounded-lg border border-border/60">
              <p class="border-b border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">Smooth</p>
              <div class="h-36">
                <DitherAurora />
              </div>
            </div>
            <div class="overflow-hidden rounded-lg border border-border/60">
              <p class="border-b border-border/60 bg-card/60 px-3 py-1.5 text-[12px] text-muted-foreground">
                Frame-rate 8
              </p>
              <div class="h-36">
                <DitherAurora frameRate={8} />
              </div>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.stepTiming} />
      </DocSection>

      {/* Sequences */}
      <DocSection id="sequences" class="animations-docs-scope">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Many animations, one clock. The timeline algebra flattens serial chains, parallel groups, staggered waves and
          loops into a single plan; the driver samples it and writes <code class="text-foreground/80">--seq-p</code> +{" "}
          <code class="text-foreground/80">data-seq</code> onto each child. Children style themselves, the engine only
          owns time. Ease with <code class="text-foreground/80">steps()</code> and the whole wave quantizes.
        </p>
        <DemoCard code={SNIPPETS.sequences}>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <For each={["start", "center", "end", "edges"] as const}>
              {(opt) => (
                <button
                  class={`rounded border px-2 py-1 text-[11px] ${
                    seqFrom() === opt
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border/60 text-muted-foreground hover:bg-accent/40"
                  }`}
                  aria-pressed={seqFrom() === opt}
                  onClick={() => setSeqFrom(opt)}
                >
                  {opt}
                </button>
              )}
            </For>
            <button
              class={`rounded border px-2 py-1 text-[11px] ${
                seqQuant()
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-accent/40"
              }`}
              aria-pressed={seqQuant()}
              onClick={() => setSeqQuant((on) => !on)}
            >
              {seqQuant() ? "steps(4)" : "linear"}
            </button>
            <button
              class="rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
              onClick={() => setSeqNonce((n) => n + 1)}
            >
              Replay
            </button>
          </div>
          <DitherSequence
            stagger={0.07}
            from={seqFrom()}
            duration={0.6}
            loop={3}
            yoyo
            easing={seqEasing()}
            restartKey={seqKey()}
            class="grid grid-cols-6 gap-2"
          >
            <For each={count(12)}>{(i) => <div class="seq-cell">{i}</div>}</For>
          </DitherSequence>
        </DemoCard>
        <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Each cell reads only its own <code class="text-foreground/80">--seq-p</code>: rise on the forward leg, sink on
          the yoyo leg, three cycles, settled at 1. Change the origin and the delay wave recomputes; quantize and{" "}
          <code class="text-foreground/80">steps(4)</code> buckets the entire group into four positions. Reduced motion
          gets the settled state with zero frames.
        </p>
        <PropsTable rows={API.sequences} />
      </DocSection>

      {/* Container queries */}
      <DocSection id="container-queries" class="animations-docs-scope">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A card in a sidebar and the same card in a wide main column are not the same card, so stop asking the
          viewport. <code class="text-foreground/80">DitherContainer</code> makes its own box the query target: it
          measures the content box (exactly what <code class="text-foreground/80">@container</code> sees), resolves a
          bucket scale onto <code class="text-foreground/80">data-cq</code> +{" "}
          <code class="text-foreground/80">--cq-w</code> / <code class="text-foreground/80">--cq-i</code>, and exposes
          the same state through its function child. Children restyle themselves in CSS while animations re-parameterize
          in JS.
        </p>
        <DemoCard code={SNIPPETS.containerQueries}>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
              aria-label="Narrow the container by 40 pixels"
              onClick={(e) => nudgeCq(e.currentTarget, -40)}
            >
              −
            </button>
            <button
              type="button"
              class="rounded border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
              aria-label="Widen the container by 40 pixels"
              onClick={(e) => nudgeCq(e.currentTarget, 40)}
            >
              +
            </button>
            <span class="text-[11px] text-muted-foreground">
              drag the corner too: every child reads this box, never the viewport
            </span>
          </div>
          <DitherContainer scale={{ xs: 0, sm: 260, md: 360, lg: 450, xl: 530 }} step={8} name="demo" class="cq-panel">
            {(cq) => (
              <>
                <div class="cq-readout">
                  <span class="cq-bucket">{cq.size}</span>
                  <span>
                    {cq.width}px, q8 {quantize(cq.width, 8)}, matches {cq.matches.join(" ")}
                  </span>
                </div>
                <DitherSequence
                  stagger={0.03 + cq.index * 0.02}
                  from={cq.index >= 3 ? "center" : "start"}
                  restartKey={cq.size ?? "xs"}
                  class="cq-grid"
                >
                  <For each={count(12)}>{(i) => <div class="seq-cell">{i}</div>}</For>
                </DitherSequence>
                <div class="cq-scan" aria-hidden="true" />
              </>
            )}
          </DitherContainer>
        </DemoCard>
        <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          The grid re-columns purely from <code class="text-foreground/80">[data-cq]</code> (CSS reading the container's
          own state), while the Sequence's stagger, origin and replay derive from the same bucket through the child.
          Narrow it to <code class="text-foreground/80">xs</code> and the wave tightens to 0.03s/cell; widen to{" "}
          <code class="text-foreground/80">xl</code> and it fans from the center at 0.11s.{" "}
          <code class="text-foreground/80">quantize()</code> rounds widths to the step so readouts and canvas painters
          hold like frames: the spatial half of the timing engine's step idea. This demo overrides{" "}
          <code class="text-foreground/80">scale</code> so all five buckets fit the docs column; the default{" "}
          <code class="text-foreground/80">CONTAINER_SCALE</code> targets wider shells. The blue bar runs the shipped{" "}
          <code class="text-foreground/80">dither-cq-traverse</code> keyframe:{" "}
          <code class="text-foreground/80">translateX(±100cqw)</code> makes its journey exactly one container width, so
          a resize re-scales the animation live, where <code class="text-foreground/80">translateX(50%)</code> would
          measure the bar itself and <code class="text-foreground/80">vw</code> would measure the viewport.
        </p>
        <PropsTable rows={API.containerQueries} />
      </DocSection>

      {/* Stage: layers in container units */}
      <DocSection id="stage" class="animations-docs-scope">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Layers in container units. A <code class="text-foreground/80">DitherStage</code> is a size query container
          with one clock (the kit's, so it seeks for video), and each{" "}
          <code class="text-foreground/80">DitherLayer</code> runs keyframes whose lengths keep their units through
          interpolation: <code class="text-foreground/80">10cqw</code> to <code class="text-foreground/80">30cqw</code>{" "}
          is <code class="text-foreground/80">20cqw</code> halfway, mixed units become a{" "}
          <code class="text-foreground/80">calc()</code>. Canvas, SVG and DOM layers move exactly relative to the stage
          at any size, and the same sample resolves to px through the child for anything that paints. Shrink the stage:
          every path shrinks with it.
        </p>
        <DemoCard code={SNIPPETS.stage}>
          <div ref={widen} class="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <label class="flex items-center gap-2">
              stage width
              <input
                value={stageWidth()}
                onInput={(e) => setStageWidth(Number(e.currentTarget.value))}
                type="range"
                min="40"
                max="100"
                step="5"
                name="stage-width"
                class="h-6 accent-foreground"
              />
            </label>
            <span class="tabular-nums">{stageWidth()}%</span>
          </div>
          <DitherStage duration={8} class="stage-demo">
            {(stage) => (
              <>
                <DitherLayer keyframes={[{ x: "-6cqw" }, { x: "6cqw" }]} duration={8} yoyo loop class="stage-sky">
                  <DitherAurora colors={["#1f6fd6", "#9ec5ff", "#ffffff"]} speed={0.6} class="h-full" />
                </DitherLayer>
                <DitherLayer keyframes={[{ x: 0 }, { x: "-10cqw" }]} duration={8} yoyo loop>
                  <svg class="stage-hills far" viewBox="0 0 132 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 40 V26 Q12 14 24 22 T48 18 T72 24 T96 14 T120 22 T132 18 V40 Z" />
                  </svg>
                </DitherLayer>
                <DitherLayer keyframes={[{ x: 0 }, { x: "-24cqw" }]} duration={8} yoyo loop>
                  <svg class="stage-hills near" viewBox="0 0 148 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 40 V30 Q14 22 28 30 T56 24 T84 32 T112 22 T140 30 T148 26 V40 Z" />
                  </svg>
                </DitherLayer>
                <DitherLayer
                  keyframes={[
                    { at: 0, x: "80cqw", y: "12cqh", rotate: 0 },
                    { at: "50%", easing: "ease-in-out", rotate: "0.5turn" },
                    { x: "20cqw", y: "8cqh", rotate: "1turn" },
                  ]}
                  duration={8}
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
                <DitherLayer
                  keyframes={[
                    { cx: "10cqw", cy: "70cqh" },
                    { cx: "90cqw", cy: "40cqh" },
                  ]}
                  duration={4}
                  yoyo
                  loop
                >
                  {(at) => (
                    <svg
                      viewBox={`0 0 ${Math.max(1, stage.width)} ${Math.max(1, stage.height)}`}
                      class="stage-dot"
                      aria-hidden="true"
                    >
                      <circle cx={at.cx} cy={at.cy} r="4" />
                      <text x={at.cx + 8} y={at.cy + 3}>
                        {Math.round(at.cx)}, {Math.round(at.cy)}px
                      </text>
                    </svg>
                  )}
                </DitherLayer>
              </>
            )}
          </DitherStage>
        </DemoCard>
        <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          The aurora is a canvas surface riding a layer: it drifts twelve percent of the stage, never twelve percent of
          the viewport. The two hills are SVGs on their own layers at two speeds: parallax in container units. The moon
          places its keys with <code class="text-foreground/80">at</code> (seconds or a percentage) and eases one
          segment. The last layer keeps custom keys, <code class="text-foreground/80">cx</code> and{" "}
          <code class="text-foreground/80">cy</code>, which the child is handed resolved to px against the measured box:
          exactly the numbers a canvas painter needs. Nothing here is a CSS animation: the stage's clock samples every
          track, so a frame exported to video lands on the same moment.
        </p>
        <PropsTable rows={API.stage} />
        <PropsTable rows={API.layer} />
      </DocSection>
    </>
  )
}
