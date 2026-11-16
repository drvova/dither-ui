import { createSignal } from "solid-js"
import { DitherPagination } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [page, setPage] = createSignal(3)

  return (
    <div class="grid gap-4">
      {/* Centred while it fits; on the narrowest phones it scrolls. */}
      <div class="overflow-x-auto">
        <div class="mx-auto w-max">
          <DitherPagination page={page()} onUpdatePage={setPage} total={12} />
        </div>
      </div>
      <p class="text-center text-[12px] text-muted-foreground">on page {page()} of 12</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherPagination,
  title: "Pagination",
  studio: {
    group: "navigation",
    frame: { w: 380, h: 80 },
    controls: { total: { min: 1, max: 100 }, siblings: { min: 0, max: 3 } },
    model: { demo: 4, prop: "page", event: "update:page" },
  },
})
