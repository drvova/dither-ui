import { DitherSeparator } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <p>Charts render on canvas.</p>
      <DitherSeparator class="my-4" />
      <p>Fills threshold the same Bayer matrix.</p>

      {/* vertical */}
      <div class="flex h-5 items-center gap-4">
        <span>docs</span>
        <DitherSeparator orientation="vertical" />
        <span>studio</span>
      </div>
    </>
  )
}

export const meta = defineExample({
  component: DitherSeparator,
  title: "Separator",
  studio: { group: "display", frame: { w: 260, h: 60 }, controls: { orientation: {} } },
})
