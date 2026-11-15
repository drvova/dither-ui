import { DitherScrollProgress } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherScrollProgress /> {/* viewport, fixed top */}
      <DitherScrollProgress attach="parent" color="purple" /> {/* nearest scrollable parent */}
    </>
  )
}

export const meta = defineExample({
  component: DitherScrollProgress,
  title: "Scroll progress",
  studio: {
    group: "display",
    frame: { w: 320, h: 60 },
    controls: { attach: { demo: "parent" }, edge: { options: ["top", "bottom"] }, color: { demo: "blue" } },
  },
})
