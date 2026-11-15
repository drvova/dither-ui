import { DitherProgress, DitherScreen } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherScreen screen="diagonal">
      <DitherProgress value={60} />
    </DitherScreen>
  )
}

export const meta = defineExample({
  component: DitherScreen,
  title: "Print screen",
  studio: { group: "display", frame: { w: 260, h: 140 }, controls: { screen: {} } },
})
