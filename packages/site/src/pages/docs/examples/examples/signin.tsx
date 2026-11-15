import { DitherButton, DitherGradient } from "@dither-kit"

export default function Example() {
  return (
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient
        from="blue"
        to="transparent"
        direction="up"
        opacity={0.18}
        cell={4}
        renderMode="static"
        class="-z-10"
      />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in to your workspace</p>
      <div class="mt-5 grid gap-2.5">
        <input
          type="email"
          name="demo-email"
          placeholder="you@dither-ui.com"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
        />
        <input
          type="password"
          name="demo-password"
          placeholder="••••••••"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
        />
        <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">
          Sign in
        </DitherButton>
      </div>
      {/* the card's foot, where the wash is densest: the full ink */}
      <p class="mt-4 text-center text-[10px] text-foreground">
        No account?{" "}
        <a
          href="#/docs/signin"
          class="underline decoration-border underline-offset-2"
          onClick={(e) => e.preventDefault()}
        >
          Request access
        </a>
      </p>
    </div>
  )
}
