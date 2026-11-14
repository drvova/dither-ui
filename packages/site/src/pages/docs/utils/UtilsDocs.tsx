// The Utils: the palette's seeded colours, and the printer's screens every
// surface can print through (`ScreensSection.tsx`).
import { cssColor } from "@dither-ui/kit"
import { For } from "solid-js"
import { Sparkline } from "@/shared/ui/charts"
import DemoCard from "../DemoCard"
import { COLORS, wave } from "../demo-data"
import DocSection from "../DocSection"
import PropsTable, { type PropRow } from "../PropsTable"
import ScreensSection from "./ScreensSection"

const API: Record<string, PropRow[]> = {
  palette: [
    { prop: "cssColor(c)", type: "(DitherColor | number) → css string", default: "" },
    { prop: "seedFromColor(c)", type: "(DitherColor | number) → Seed", default: "" },
    { prop: "seedFromHue(h)", type: "(number 0…360) → Seed", default: "" },
    { prop: "DitherColor", type: '"green" … "grey": seven seeds', default: "" },
  ],
}

const SNIPPETS = {
  palette: `import { cssColor, type DitherColor } from "@dither-kit"
cssColor("blue") // rgb(53,143,243)`,
}

export default function UtilsDocs() {
  return (
    <>
      {/* Palette */}
      <DocSection defer id="palette">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Seven seeded colors; every component resolves fill, line and sparkle hues from the same seed, so a dashboard
          stays coherent for free.
        </p>
        <DemoCard code={SNIPPETS.palette}>
          <div class="grid gap-3">
            <For each={COLORS}>
              {(c) => (
                <div class="flex items-center gap-4">
                  <span class="w-14 text-[11px] text-muted-foreground">{c}</span>
                  <span class="size-5 rounded-[3px]" style={{ "background-color": cssColor(c) }} />
                  <Sparkline data={wave} color={c} class="h-6 flex-1" />
                </div>
              )}
            </For>
          </div>
        </DemoCard>
        <PropsTable rows={API.palette} />
      </DocSection>

      {/* Print screens */}
      <ScreensSection />
    </>
  )
}
