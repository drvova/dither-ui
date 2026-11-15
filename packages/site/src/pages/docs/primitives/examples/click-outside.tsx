import { createSignal, Show } from "solid-js"
import { DitherClickOutside } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="flex justify-center">
      <DitherClickOutside enabled={open()} onOutside={() => setOpen(false)}>
        <div class="grid gap-2">
          <button
            class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={() => setOpen(!open())}
          >
            {open() ? "menu open: click anywhere outside" : "open the menu"}
          </button>
          <Show when={open()}>
            <div class="rounded-md border border-border/60 bg-card p-2 text-[11px] text-muted-foreground">
              Pressing outside closes this.
            </div>
          </Show>
        </div>
      </DitherClickOutside>
    </div>
  )
}

export const meta = defineExample({
  component: DitherClickOutside,
  title: "Click outside",
  studio: { group: "structure", frame: { w: 240, h: 110 }, controls: { enabled: {} }, slot: "Press outside this" },
})
