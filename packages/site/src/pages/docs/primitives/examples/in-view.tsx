import { DitherInView } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherInView rootMargin="200px" once>
      {(scope) => <p class="text-[13px]">{scope.inView ? "In view" : "Reveals in view"}</p>}
    </DitherInView>
  )
}

export const meta = defineExample({
  component: DitherInView,
  title: "In view",
  studio: {
    group: "structure",
    frame: { w: 240, h: 110 },
    controls: { rootMargin: {}, threshold: { min: 0, max: 1, step: 0.05 }, once: {} },
    slot: "Reveals in view",
  },
})
