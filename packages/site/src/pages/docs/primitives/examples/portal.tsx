import { DitherPortal } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // The chip is declared inside a clipped box and lands in the target
  // beside it: the escape, kept inside the box it shows in. disabled keeps
  // it in place (SSR, tests).
  // keep it in place (SSR / tests)
  return (
    <div class="grid gap-3 text-[12px] text-muted-foreground sm:grid-cols-2">
      <div class="h-24 overflow-hidden rounded-md border border-border/60 p-4">
        Declared in here, a box with <code class="text-foreground/80">overflow: hidden</code>.{" "}
        <DitherPortal to="#portal-demo-out" defer>
          <span class="rounded-md border border-border/60 bg-card px-3 py-1.5 text-[11px]">teleported out</span>
        </DitherPortal>
      </div>
      <div
        class="grid h-24 place-items-center rounded-md border border-dashed border-border/60 p-4"
        id="portal-demo-out"
      />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPortal,
  title: "Portal",
  studio: {
    group: "structure",
    frame: { w: 240, h: 100 },
    controls: { to: { kind: "select", options: ["body"] }, disabled: {} },
  },
})
