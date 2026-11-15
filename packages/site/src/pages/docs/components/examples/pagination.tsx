import { createSignal } from "solid-js"
import { DitherPagination } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [page, setPage] = createSignal(4)

  return <DitherPagination total={12} page={page()} onUpdatePage={setPage} />
}

export const meta = defineExample({
  component: DitherPagination,
  title: "Pagination",
  studio: {
    group: "navigation",
    frame: { w: 380, h: 80 },
    controls: { total: { min: 1, max: 100 }, siblings: { min: 0, max: 3 } },
    model: { prop: "page", event: "update:page" },
  },
})
