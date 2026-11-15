import { createSignal, Show } from "solid-js"
import { DitherFocusScope } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  // focus enters on open, Tab cycles inside, returns to the opener on close
  return (
    <div class="grid justify-items-center gap-3">
      <button
        class="rounded-md border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => setOpen(!open())}
      >
        {open() ? "close (focus returns to me)" : "open a focus scope"}
      </button>
      <Show when={open()}>
        <DitherFocusScope class="grid gap-2 rounded-md border border-border/60 bg-card p-4 text-center">
          <h3 class="text-[12px] text-foreground" tabindex="-1">
            Scope active
          </h3>
          <div class="flex justify-center gap-2">
            <button class="rounded border border-border/60 px-3 py-1 text-[11px]" type="button">
              Yes
            </button>
            <button class="rounded border border-border/60 px-3 py-1 text-[11px]" type="button">
              No
            </button>
          </div>
          <span class="text-[10px] text-muted-foreground">Tab cycles here, nowhere else</span>
        </DitherFocusScope>
      </Show>
    </div>
  )
}

export const meta = defineExample({
  component: DitherFocusScope,
  title: "Focus scope",
  studio: {
    group: "structure",
    frame: { w: 260, h: 130 },
    controls: { autofocus: { demo: false }, trapped: { demo: false }, restoreFocus: { demo: false } },
    slot: "Scoped content",
  },
})
