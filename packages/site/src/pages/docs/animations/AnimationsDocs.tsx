import { createSignal, For } from "solid-js"
import type {} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { exampleCode } from "../example-code"
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
import StarBorderExample from "./examples/star-border"
import starBorderCode from "./examples/star-border.tsx?raw"
import ElectricBorderExample from "./examples/electric-border"
import electricBorderCode from "./examples/electric-border.tsx?raw"
import LogoLoopExample from "./examples/logo-loop"
import logoLoopCode from "./examples/logo-loop.tsx?raw"
import OrbitImagesExample from "./examples/orbit-images"
import orbitImagesCode from "./examples/orbit-images.tsx?raw"
import ExpandTabsExample from "./examples/expand-tabs"
import expandTabsCode from "./examples/expand-tabs.tsx?raw"
import ExpandingArrowExample from "./examples/expanding-arrow"
import expandingArrowCode from "./examples/expanding-arrow.tsx?raw"
import AnimatedContentExample from "./examples/animated-content"
import animatedContentCode from "./examples/animated-content.tsx?raw"
import FadeContentExample from "./examples/fade-content"
import fadeContentCode from "./examples/fade-content.tsx?raw"
import GradualBlurExample from "./examples/gradual-blur"
import gradualBlurCode from "./examples/gradual-blur.tsx?raw"
import GlareHoverExample from "./examples/glare-hover"
import glareHoverCode from "./examples/glare-hover.tsx?raw"
import MagnetExample from "./examples/magnet"
import magnetCode from "./examples/magnet.tsx?raw"
import ClickSparkExample from "./examples/click-spark"
import clickSparkCode from "./examples/click-spark.tsx?raw"
import BlobCursorExample from "./examples/blob-cursor"
import blobCursorCode from "./examples/blob-cursor.tsx?raw"
import CrosshairExample from "./examples/crosshair"
import crosshairCode from "./examples/crosshair.tsx?raw"
import GhostCursorExample from "./examples/ghost-cursor"
import ghostCursorCode from "./examples/ghost-cursor.tsx?raw"
import SplashCursorExample from "./examples/splash-cursor"
import splashCursorCode from "./examples/splash-cursor.tsx?raw"
import TargetCursorExample from "./examples/target-cursor"
import targetCursorCode from "./examples/target-cursor.tsx?raw"
import PixelTrailExample from "./examples/pixel-trail"
import pixelTrailCode from "./examples/pixel-trail.tsx?raw"
import ImageTrailExample from "./examples/image-trail"
import imageTrailCode from "./examples/image-trail.tsx?raw"
import MetaBallsExample from "./examples/meta-balls"
import metaBallsCode from "./examples/meta-balls.tsx?raw"
import MetallicPaintExample from "./examples/metallic-paint"
import metallicPaintCode from "./examples/metallic-paint.tsx?raw"
import NoiseExample from "./examples/noise"
import noiseCode from "./examples/noise.tsx?raw"
import CubesExample from "./examples/cubes"
import cubesCode from "./examples/cubes.tsx?raw"
import RibbonsExample from "./examples/ribbons"
import ribbonsCode from "./examples/ribbons.tsx?raw"
import ShapeBlurExample from "./examples/shape-blur"
import shapeBlurCode from "./examples/shape-blur.tsx?raw"
import StrandsExample from "./examples/strands"
import strandsCode from "./examples/strands.tsx?raw"
import LaserFlowExample from "./examples/laser-flow"
import laserFlowCode from "./examples/laser-flow.tsx?raw"
import AntigravityExample from "./examples/antigravity"
import antigravityCode from "./examples/antigravity.tsx?raw"
import MagicRingsExample from "./examples/magic-rings"
import magicRingsCode from "./examples/magic-rings.tsx?raw"
import MagnetLinesExample from "./examples/magnet-lines"
import magnetLinesCode from "./examples/magnet-lines.tsx?raw"
import PixelTransitionExample from "./examples/pixel-transition"
import pixelTransitionCode from "./examples/pixel-transition.tsx?raw"
import DitherRevealExample from "./examples/dither-reveal"
import ditherRevealCode from "./examples/dither-reveal.tsx?raw"
import StickerPeelExample from "./examples/sticker-peel"
import stickerPeelCode from "./examples/sticker-peel.tsx?raw"
import IslandExample from "./examples/island"
import islandCode from "./examples/island.tsx?raw"
import CardStackExample from "./examples/card-stack"
import cardStackCode from "./examples/card-stack.tsx?raw"
import DockExample from "./examples/dock"
import dockCode from "./examples/dock.tsx?raw"
import PreviewRailExample from "./examples/preview-rail"
import previewRailCode from "./examples/preview-rail.tsx?raw"
import ScrollProgressExample from "./examples/scroll-progress"
import scrollProgressCode from "./examples/scroll-progress.tsx?raw"
import SnapButtonExample from "./examples/snap-button"
import snapButtonCode from "./examples/snap-button.tsx?raw"
import GooeyMenuExample from "./examples/gooey-menu"
import gooeyMenuCode from "./examples/gooey-menu.tsx?raw"
import BouncyAccordionExample from "./examples/bouncy-accordion"
import bouncyAccordionCode from "./examples/bouncy-accordion.tsx?raw"
import SlideActionExample from "./examples/slide-action"
import slideActionCode from "./examples/slide-action.tsx?raw"
import HoldActionExample from "./examples/hold-action"
import holdActionCode from "./examples/hold-action.tsx?raw"
import WalletCardExample from "./examples/wallet-card"
import walletCardCode from "./examples/wallet-card.tsx?raw"
import NotificationStackExample from "./examples/notification-stack"
import notificationStackCode from "./examples/notification-stack.tsx?raw"
import SequencesExample from "./examples/sequences"
import sequencesCode from "./examples/sequences.tsx?raw"
import ContainerQueriesExample from "./examples/container-queries"
import containerQueriesCode from "./examples/container-queries.tsx?raw"
import StageExample from "./examples/stage"
import stageCode from "./examples/stage.tsx?raw"
import StepTiming2Example from "./examples/step-timing-2"
import stepTiming2Code from "./examples/step-timing-2.tsx?raw"

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
}

const STACK_VARIANTS = ["stack", "fan", "condensed"] as const
const stackChip = (active: boolean) =>
  `rounded px-2.5 py-1 text-[11px] transition-colors ${active ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`

export default function AnimationsDocs() {
  const [stackVariant, setStackVariant] = createSignal<(typeof STACK_VARIANTS)[number]>("stack")
  // the variant picker's choice as the example's prop: stack is its default, left out
  const stackPicks = () => ({ variant: stackVariant() === "stack" ? undefined : stackVariant() })

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
        <DemoCard code={animatedContentCode}>
          <AnimatedContentExample />
        </DemoCard>
        <PropsTable rows={API.animatedContent} />
      </DocSection>

      {/* Fade content */}
      <DocSection id="fade-content">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A pure fade-in on view, optionally de-blurring as it appears. The lighter cousin of Animated content when you
          only want opacity.
        </p>
        <DemoCard code={fadeContentCode}>
          <FadeContentExample />
        </DemoCard>
        <PropsTable rows={API.fadeContent} />
      </DocSection>

      {/* Gradual blur */}
      <DocSection id="gradual-blur">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A masked <code class="text-foreground/80">backdrop-filter</code> strip that progressively blurs toward an
          edge: the iOS-style soft fade over a scroll region.
        </p>
        <DemoCard code={gradualBlurCode}>
          <GradualBlurExample />
        </DemoCard>
        <PropsTable rows={API.gradualBlur} />
      </DocSection>

      {/* Star border */}
      <DocSection id="star-border">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rounded frame with two bright glints traveling its top and bottom edges: a subtle animated outline for a CTA
          or badge.
        </p>
        <DemoCard code={starBorderCode}>
          <StarBorderExample />
        </DemoCard>
        <PropsTable rows={API.starBorder} />
      </DocSection>

      {/* Electric border */}
      <DocSection id="electric-border">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An SVG turbulence filter jitters the frame edge into a crackling electric outline. Reduced motion drops the
          displacement.
        </p>
        <DemoCard code={electricBorderCode}>
          <ElectricBorderExample />
        </DemoCard>
        <PropsTable rows={API.electricBorder} />
      </DocSection>

      {/* Glare hover */}
      <DocSection id="glare-hover">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A diagonal sheen sweeps across the surface on hover: the glossy-card reflection, done with a single masked
          gradient. Hover the card.
        </p>
        <DemoCard code={glareHoverCode}>
          <GlareHoverExample />
        </DemoCard>
        <PropsTable rows={API.glareHover} />
      </DocSection>

      {/* Magnet */}
      <DocSection id="magnet">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The wrapped element is pulled toward the pointer while it is within range, easing back when the cursor leaves.
          Move your cursor near the button.
        </p>
        <DemoCard code={magnetCode}>
          <MagnetExample />
        </DemoCard>
        <PropsTable rows={API.magnet} />
      </DocSection>

      {/* Click spark */}
      <DocSection id="click-spark">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A burst of spark lines radiates from every click inside the area, drawn on a lightweight canvas overlay. Click
          anywhere in the preview.
        </p>
        <DemoCard code={clickSparkCode}>
          <ClickSparkExample />
        </DemoCard>
        <PropsTable rows={API.clickSpark} />
      </DocSection>

      {/* Blob cursor */}
      <DocSection id="blob-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A soft, screen-blended blob eases toward the pointer inside the area: a gooey cursor companion. Move your
          cursor over the box.
        </p>
        <DemoCard code={blobCursorCode}>
          <BlobCursorExample />
        </DemoCard>
        <PropsTable rows={API.blobCursor} />
      </DocSection>

      {/* Crosshair */}
      <DocSection id="crosshair">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Full-height and full-width guide lines track the pointer across the area: a precision reticle. Move your
          cursor over the box.
        </p>
        <DemoCard code={crosshairCode}>
          <CrosshairExample />
        </DemoCard>
        <PropsTable rows={API.crosshair} />
      </DocSection>

      {/* Ghost cursor */}
      <DocSection id="ghost-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A tapering trail of fading dots chases the pointer on a canvas overlay. Move your cursor over the box.
        </p>
        <DemoCard code={ghostCursorCode}>
          <GhostCursorExample />
        </DemoCard>
        <PropsTable rows={API.ghostCursor} />
      </DocSection>

      {/* Splash cursor */}
      <DocSection id="splash-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Expanding ripple rings bloom along the pointer path, like drops on water. Move your cursor over the box.
        </p>
        <DemoCard code={splashCursorCode}>
          <SplashCursorExample />
        </DemoCard>
        <PropsTable rows={API.splashCursor} />
      </DocSection>

      {/* Target cursor */}
      <DocSection id="target-cursor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A slowly rotating corner-bracket reticle locks onto the pointer: a HUD targeting frame. Move your cursor over
          the box.
        </p>
        <DemoCard code={targetCursorCode}>
          <TargetCursorExample />
        </DemoCard>
        <PropsTable rows={API.targetCursor} />
      </DocSection>

      {/* Pixel trail */}
      <DocSection id="pixel-trail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The pointer lights up cells of a pixel grid that then fade back out: a glowing wake across the lattice. Move
          your cursor over the box.
        </p>
        <DemoCard code={pixelTrailCode}>
          <PixelTrailExample />
        </DemoCard>
        <PropsTable rows={API.pixelTrail} />
      </DocSection>

      {/* Image trail */}
      <DocSection id="image-trail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Tiles from a palette drop along the pointer path, rotating and shrinking as they fade. Pass real image URLs
          via <code class="text-foreground/80">colors</code> swapped for tiles here. Move your cursor over the box.
        </p>
        <DemoCard code={imageTrailCode}>
          <ImageTrailExample />
        </DemoCard>
        <PropsTable rows={API.imageTrail} />
      </DocSection>

      {/* Meta balls */}
      <DocSection id="meta-balls">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Orbiting blobs fuse into a gooey metaball iso-surface, tinted and ordered-dithered through the kit engine. The
          pointer adds a blob.
        </p>
        <DemoCard code={metaBallsCode}>
          <MetaBallsExample />
        </DemoCard>
        <PropsTable rows={API.metaBalls} />
      </DocSection>

      {/* Metallic paint */}
      <DocSection id="metallic-paint">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Iterative domain-warped reflections read as flowing liquid chrome. Fully opaque, dithered across a metallic
          ramp.
        </p>
        <DemoCard code={metallicPaintCode}>
          <MetallicPaintExample />
        </DemoCard>
        <PropsTable rows={API.metallicPaint} />
      </DocSection>

      {/* Noise */}
      <DocSection id="noise">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Animated hashed grain thresholded against the Bayer matrix: living static for a texture overlay. Tune{" "}
          <code class="text-foreground/80">density</code> and blend it over content.
        </p>
        <DemoCard code={noiseCode}>
          <NoiseExample />
        </DemoCard>
        <PropsTable rows={API.noise} />
      </DocSection>

      {/* Cubes */}
      <DocSection id="cubes">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A rhombille tiling shades into a field of isometric cubes, each face lit and pulsing on noise. Tinted and
          ordered-dithered.
        </p>
        <DemoCard code={cubesCode}>
          <CubesExample />
        </DemoCard>
        <PropsTable rows={API.cubes} />
      </DocSection>

      {/* Ribbons */}
      <DocSection id="ribbons">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Thick flowing bands ride wavy fbm centerlines, bright at the core and tinted per ribbon. The pointer bends
          nearby ribbons toward it.
        </p>
        <DemoCard code={ribbonsCode}>
          <RibbonsExample />
        </DemoCard>
        <PropsTable rows={API.ribbons} />
      </DocSection>

      {/* Shape blur */}
      <DocSection id="shape-blur">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A big soft blob morphs on noise and drifts toward the pointer: a gentle out-of-focus shape. Move your cursor
          over it.
        </p>
        <DemoCard code={shapeBlurCode}>
          <ShapeBlurExample />
        </DemoCard>
        <PropsTable rows={API.shapeBlur} />
      </DocSection>

      {/* Strands */}
      <DocSection id="strands">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dozens of thin filaments sway on fbm like blown hair, tinted by depth and ordered-dithered with transparent
          gaps.
        </p>
        <DemoCard code={strandsCode}>
          <StrandsExample />
        </DemoCard>
        <PropsTable rows={API.strands} />
      </DocSection>

      {/* Laser flow */}
      <DocSection id="laser-flow">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sharp horizontal beams sweep with additive bloom and a faint jitter, tinted per beam: a scanning laser array.
        </p>
        <DemoCard code={laserFlowCode}>
          <LaserFlowExample />
        </DemoCard>
        <PropsTable rows={API.laserFlow} />
      </DocSection>

      {/* Antigravity */}
      <DocSection id="antigravity">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A field of motes drifts upward and wraps: gravity in reverse, layered behind your content.
        </p>
        <DemoCard code={antigravityCode}>
          <AntigravityExample />
        </DemoCard>
        <PropsTable rows={API.antigravity} />
      </DocSection>

      {/* Logo loop */}
      <DocSection id="logo-loop">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A seamless infinite marquee of items. Pass logos or wordmarks and it loops forever with a measured wrap.
        </p>
        <DemoCard code={logoLoopCode}>
          <div class="w-full text-xl font-medium tracking-tight text-muted-foreground">
            <LogoLoopExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.logoLoop} />
      </DocSection>

      {/* Magic rings */}
      <DocSection id="magic-rings">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Concentric rings pulse outward from the center on a stagger: a radar-ping halo around whatever you wrap.
        </p>
        <DemoCard code={magicRingsCode}>
          <MagicRingsExample />
        </DemoCard>
        <PropsTable rows={API.magicRings} />
      </DocSection>

      {/* Magnet lines */}
      <DocSection id="magnet-lines">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A grid of little needles all swivel to point at the pointer, like iron filings over a magnet. Move your cursor
          over the box.
        </p>
        <DemoCard code={magnetLinesCode}>
          <MagnetLinesExample />
        </DemoCard>
        <PropsTable rows={API.magnetLines} />
      </DocSection>

      {/* Orbit images */}
      <DocSection id="orbit-images">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Items ride a circular orbit around a center point. Pass avatars, logos or labels. Counter-rotated so they stay
          upright.
        </p>
        <DemoCard code={orbitImagesCode}>
          <div class="grid min-h-56 place-items-center">
            <OrbitImagesExample />
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
        <DemoCard code={pixelTransitionCode}>
          <PixelTransitionExample />
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
        <DemoCard code={ditherRevealCode}>
          <DitherRevealExample />
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
        <DemoCard code={stickerPeelCode}>
          <StickerPeelExample />
        </DemoCard>
        <PropsTable rows={API.stickerPeel} />
      </DocSection>

      <DocSection id="expand-tabs">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An icon bar where only the active tab unfolds its label. The rest stay square glyphs. The label slides through
          the house 0fr grid trick.
        </p>
        <DemoCard code={expandTabsCode}>
          <div class="grid min-h-24 place-items-center">
            <ExpandTabsExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.expandTabs} />
      </DocSection>

      <DocSection id="island">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A morphing status pill: the compact row keeps its pulse while the detail unfolds beneath. Escape collapses;
          reduced motion snaps.
        </p>
        <DemoCard code={islandCode}>
          <IslandExample />
        </DemoCard>
        <PropsTable rows={API.island} />
      </DocSection>

      <DocSection id="card-stack">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A swipe deck on the kit's own gesture math: 1:1 tracking, rubber-band past the edge, a flick or a far drag
          sends the card flying and the stack rises. Drag the top card.
        </p>
        <DemoCard code={cardStackCode}>
          <CardStackExample />
        </DemoCard>
        <PropsTable rows={API.cardStack} />
      </DocSection>

      <DocSection id="dock">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A hover-magnifying dock: items swell on a gaussian falloff around the pointer and settle when it leaves.
          Reduced motion keeps the row still.
        </p>
        <DemoCard code={dockCode}>
          <DockExample />
        </DemoCard>
        <PropsTable rows={API.dock} />
      </DocSection>

      <DocSection id="preview-rail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A Codex app-inspired navigation rail: compact ticks form a pyramid around the pointer and reveal a floating
          destination preview beside the rail. Keyboard focus previews too; reduced motion keeps the ticks still.
        </p>
        <DemoCard code={previewRailCode}>
          <PreviewRailExample />
        </DemoCard>
        <PropsTable rows={API.previewRail} />
      </DocSection>

      <DocSection id="scroll-progress">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Reading progress as a dithered bar. It composes DitherProgress and rides the viewport edge, or the top of any
          scrollable parent. Scroll the box.
        </p>
        <DemoCard code={scrollProgressCode}>
          <ScrollProgressExample />
        </DemoCard>
        <PropsTable rows={API.scrollProgress} />
      </DocSection>

      <DocSection id="snap-button">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Pull to confirm: drag past the line and the border arms; release fires and the button springs home. Short
          pulls just spring. Enter and Space fire without the pull; reduced motion skips the spring.
        </p>
        <DemoCard code={snapButtonCode}>
          <SnapButtonExample />
        </DemoCard>
        <PropsTable rows={API.snapButton} />
      </DocSection>

      <DocSection id="gooey-menu">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Actions that melt out of one trigger: an SVG goo filter fuses the circles while they travel, then they settle
          apart. Escape collapses; reduced motion drops the travel.
        </p>
        <DemoCard code={gooeyMenuCode}>
          <GooeyMenuExample />
        </DemoCard>
        <PropsTable rows={API.gooeyMenu} />
      </DocSection>

      <DocSection id="bouncy-accordion">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A single-open accordion with a weighted spring layout: panels overshoot and settle on a sampled damped-spring
          easing, icon rows lead each header, and content rises into view. Reduced motion reveals instantly.
        </p>
        <DemoCard code={bouncyAccordionCode}>
          <BouncyAccordionExample />
        </DemoCard>
        <PropsTable rows={API.bouncyAccordion} />
      </DocSection>

      <DocSection id="expanding-arrow">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An accent tile that expands into a dotted-arrow trail on hover or focus. The trail is stamped from the same
          accent hue. Reduced motion reveals it instantly.
        </p>
        <DemoCard code={expandingArrowCode}>
          <div class="flex min-h-24 items-center justify-center">
            <ExpandingArrowExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.expandingArrow} />
      </DocSection>

      <DocSection id="slide-action">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Drag the thumb to the end of the track to confirm (flick momentum counts), or release early and it springs
          back. Enter or Space confirms without the slide.
        </p>
        <DemoCard code={slideActionCode}>
          <SlideActionExample />
        </DemoCard>
        <PropsTable rows={API.slideAction} />
      </DocSection>

      <DocSection id="hold-action">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Hold to complete: a liquid fill with a dotted crest rises (or slides) while you press; release early and it
          drains back. A held Enter or Space works the same way.
        </p>
        <DemoCard code={holdActionCode}>
          <HoldActionExample />
        </DemoCard>
        <PropsTable rows={API.holdAction} />
      </DocSection>

      <DocSection id="wallet-card">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A wallet overview card: the account switcher and search morph open from their triggers (recents listed in the
          panel), the balance cascades in with a change pill and privacy toggle, the address copies with feedback, the
          bell carries an unread pulse, and Send / Deposit / Swap / Buy report through one event.
        </p>
        <DemoCard code={walletCardCode}>
          <WalletCardExample />
        </DemoCard>
        <PropsTable rows={API.walletCard} />
      </DocSection>

      <DocSection id="notification-stack">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Compact notification cards that spring from a stacked summary into a readable list on hover, focus or tap. Tap
          pins the list open, and the view-all row appears with the expansion. Reduced motion snaps.
        </p>
        <DemoCard code={exampleCode(notificationStackCode, stackPicks())}>
          <NotificationStackExample {...stackPicks()} />
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
        <DemoCard code={stepTiming2Code}>
          <StepTiming2Example />
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
        <DemoCard code={sequencesCode}>
          <SequencesExample />
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
        <DemoCard code={containerQueriesCode}>
          <ContainerQueriesExample />
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
        <DemoCard code={stageCode}>
          <StageExample />
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
