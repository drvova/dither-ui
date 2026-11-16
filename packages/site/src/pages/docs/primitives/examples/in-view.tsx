import { DitherInView } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherInView class="grid h-40 place-items-center" once={true}>
      {(scope) => (
        <div
          class={`grid h-full w-full place-items-center rounded-md border border-border/60 transition-opacity duration-500 ${scope.inView ? "bg-card/40 opacity-100" : "opacity-0"}`}
        >
          <span class="text-[12px] text-muted-foreground">
            {scope.inView ? "in view ✓" : "waiting for the viewport…"}
          </span>
        </div>
      )}
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
