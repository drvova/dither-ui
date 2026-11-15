import { DitherSkeleton } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="rounded-lg border p-5">
      <div class="flex items-center gap-3">
        <DitherSkeleton class="size-10 rounded-full" />
        <div class="grid flex-1 gap-2">
          <DitherSkeleton class="h-3 w-2/3 rounded" />
          <DitherSkeleton class="h-3 w-1/3 rounded" />
        </div>
      </div>
      <DitherSkeleton class="mt-4 h-24 w-full rounded" />
    </div>
  )
}

export const meta = defineExample({
  component: DitherSkeleton,
  title: "Skeleton",
  studio: { group: "display", frame: { w: 300, h: 100 }, controls: {} },
})
