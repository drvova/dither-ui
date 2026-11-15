import { createEffect, createSignal } from "solid-js"
import { DitherAurora, DitherLayer, DitherStage } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // the stage takes no style, so its width is written on its element: the one after the slider's row
  const [stageWidth, setStageWidth] = createSignal(100)
  const widen = (row: HTMLElement) =>
    createEffect(() => {
      const width = `${stageWidth()}%`
      const stage = row.nextElementSibling
      if (stage instanceof HTMLElement) stage.style.width = width
    })

  // a canvas layer drifts 12% of the stage, at any size
  // SVG parallax
  // the moon places its keys with at (seconds or a percentage)
  // the same keys, resolved to px for painters
  // the engine alone: sampleKeyframes, keyframeTransform and resolveSample sample the same keys,
  // write the transform and resolve it to px
  return (
    <>
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
