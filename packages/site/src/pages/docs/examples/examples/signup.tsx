import { createSignal, For } from "solid-js"
import { DitherButton, DitherGradient } from "@dither-kit"

export default function Example() {
  const PLANS = ["Free", "Pro", "Scale"] as const
  const [plan, setPlan] = createSignal<(typeof PLANS)[number]>("Free")

  return (
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient
        class="-z-10"
        from="purple"
        to="transparent"
        direction="up"
        opacity={0.16}
        cell={4}
        renderMode="static"
      />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <p class="mt-1.5 text-[11px] text-muted-foreground">Create your workspace</p>
      <div class="mt-5 grid gap-2.5">
        <input
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          type="text"
          name="signup-name"
          placeholder="Ada Byte"
          autocomplete="off"
        />
        <input
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          type="email"
          name="signup-email"
          placeholder="you@dither-ui.com"
          autocomplete="off"
        />
        <input
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          type="password"
          name="signup-password"
          placeholder="••••••••"
          autocomplete="off"
        />
        <div class="grid grid-cols-3 gap-1 rounded-md border border-border/60 p-1" role="group" aria-label="Plan">
          <For each={PLANS}>
            {(p) => (
              <button
                class={`rounded px-2 py-1 text-[11px] transition-colors ${plan() === p ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                type="button"
                aria-pressed={plan() === p}
                onClick={() => setPlan(p)}
              >
                {p}
              </button>
            )}
          </For>
        </div>
        <DitherButton class="w-full py-2 text-[11px]" color="purple" variant="gradient">
          Create account
        </DitherButton>
      </div>
    </div>
  )
}
