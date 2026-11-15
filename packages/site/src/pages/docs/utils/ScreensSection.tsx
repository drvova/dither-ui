import { createSignal, For } from "solid-js"
import { SCREEN_KINDS, type ScreenKind } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { exampleCode } from "../example-code"
import PrintScreensExample from "./examples/print-screens"
import printScreensCode from "./examples/print-screens.tsx?raw"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import screenProps from "virtual:dither-props/DitherScreen"
import DocSection from "../DocSection"

const LABELS: Record<ScreenKind, string> = {
  bayer: "Bayer",
  line: "Line",
  diagonal: "Hatch",
  dot: "Dot",
  cross: "Cross",
}

const CHIP = "rounded border px-2 py-1 text-[11px]"
const PICKED = "border-accent bg-accent text-accent-foreground"
const UNPICKED = "border-border/60 text-muted-foreground hover:bg-accent/40"

export const API: PropRow[] = kitTable(screenProps)

export default function ScreensSection() {
  /* One DitherScreen around three different surfaces: picking a screen
     reprints all of them, the chart's series included. */
  const [screen, setScreen] = createSignal<ScreenKind>("diagonal")

  return (
    <DocSection id="print-screens">
      <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Every surface thresholds its density through a 4x4 matrix, the Bayer one unless told otherwise.{" "}
        <code class="text-foreground/80">DitherScreen</code> swaps it for a printer's screen for everything inside it:
        lines, a falling hatch, clustered dots or a cross-hatch, charts included. A surface's seed still jitters
        whichever screen it prints through, and <code class="text-foreground/80">screenMatrix</code> hands the same
        thresholds to a painter of your own.
      </p>
      <DemoCard code={exampleCode(printScreensCode, { screen: screen() })}>
        <div class="flex w-full flex-col gap-3">
          <PrintScreensExample screen={screen()} />
          <div class="flex flex-wrap justify-center gap-2">
            <For each={SCREEN_KINDS}>
              {(kind) => (
                <button
                  type="button"
                  class={`${CHIP} ${screen() === kind ? PICKED : UNPICKED}`}
                  aria-pressed={screen() === kind}
                  onClick={() => setScreen(kind)}
                >
                  {LABELS[kind]}
                </button>
              )}
            </For>
          </div>
        </div>
      </DemoCard>
      <PropsTable rows={API} />
    </DocSection>
  )
}
