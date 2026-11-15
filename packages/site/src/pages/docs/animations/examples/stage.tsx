import { DitherStage, DitherLayer, DitherAurora } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherStage duration={8} class="h-56 rounded-lg border">
        {(stage) => (
          <>
            {/* a canvas layer drifts 12% of the stage, at any size */}
            <DitherLayer keyframes={[{ x: "-6cqw" }, { x: "6cqw" }]} duration={8} yoyo loop>
              <DitherAurora colors={["#1f6fd6", "#9ec5ff", "#ffffff"]} class="h-full" />
            </DitherLayer>
            {/* SVG parallax */}
            <DitherLayer keyframes={[{ x: 0 }, { x: "-24cqw" }]} duration={8} yoyo loop>
              <svg
                viewBox="0 0 148 40"
                preserveAspectRatio="none"
                class="absolute bottom-0 h-2/5 w-[124%] fill-[#0b1a3a]"
              >
                <path d="M0 40 V30 Q14 22 28 30 T56 24 T84 32 T112 22 T140 30 T148 26 V40 Z" />
              </svg>
            </DitherLayer>
            {/* the moon places its keys with at (seconds or a percentage) */}
            <DitherLayer
              keyframes={[
                { at: 0, x: "80cqw", y: "12cqh", rotate: 0 },
                { at: "50%", easing: "ease-in-out", rotate: "0.5turn" },
                { x: "20cqw", y: "8cqh", rotate: "1turn" },
              ]}
              duration={8}
              loop
              origin="0 0"
              class="size-7"
            >
              <svg viewBox="0 0 24 24" class="size-7 fill-white">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </DitherLayer>
            {/* the same keys, resolved to px for painters */}
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
                <svg viewBox={"0 0 " + Math.max(1, stage.width) + " " + Math.max(1, stage.height)} class="size-full">
                  <circle cx={at.cx} cy={at.cy} r="4" class="fill-current" />
                </svg>
              )}
            </DitherLayer>
          </>
        )}
      </DitherStage>

      {/* the engine alone: sampleKeyframes, keyframeTransform and resolveSample
           sample the same keys, write the transform and resolve it to px */}
    </>
  )
}

export const meta = defineExample({
  component: DitherStage,
  title: "Stage",
  studio: {
    group: "display",
    frame: { w: 320, h: 200 },
    controls: {
      duration: { min: 0, max: 60, step: 0.5, demo: 6 },
      speed: { min: 0, max: 4, step: 0.1 },
      frameRate: { min: 0, max: 60, step: 1 },
      paused: {},
    },
  },
})
