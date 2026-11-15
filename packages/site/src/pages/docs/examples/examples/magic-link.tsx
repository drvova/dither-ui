import { createSignal, Show } from "solid-js"
import { DitherButton, DitherGradient } from "@dither-kit"

export default function Example() {
  const [email, setEmail] = createSignal("")
  const [sent, setSent] = createSignal(false)

  return (
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient
        class="-z-10"
        from="green"
        to="transparent"
        direction="up"
        opacity={0.14}
        cell={4}
        renderMode="static"
      />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <Show
        when={!sent()}
        fallback={
          <div class="mt-5 text-center">
            <span class="inline-block" aria-hidden="true">
              <svg class="text-foreground" width="20" height="20" viewBox="0 0 10 10" shape-rendering="crispEdges">
                <path
                  d="M1 5h1v1H1zM2 6h1v1H2zM3 7h1v1H3zM4 6h1v1H4zM5 5h1v1H5zM6 4h1v1H6zM7 3h1v1H7zM8 2h1v1H8z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <p class="mt-2 text-[12px] tracking-tight">Check your inbox</p>
            <p class="mt-1 text-[11px] text-muted-foreground">We sent a link to {email() || "your email"}</p>
            <button
              class="mt-4 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              type="button"
              onClick={() => {
                setSent(false)
                setEmail("")
              }}
            >
              use a different email
            </button>
          </div>
        }
      >
        <>
          <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in without a password</p>
          <div class="mt-5 grid gap-2.5">
            <input
              class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              type="email"
              name="magic-email"
              placeholder="you@dither-ui.com"
              autocomplete="off"
            />
            <DitherButton
              class="w-full py-2 text-[11px]"
              color="green"
              variant="gradient"
              onClick={() => setSent(true)}
            >
              Send magic link
            </DitherButton>
          </div>
        </>
      </Show>
    </div>
  )
}
