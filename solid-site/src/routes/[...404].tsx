// The page an unknown address lands on, on the landing's ground: a line
// saying why, and the ways back. The pointer prints over the whole ground,
// so even a dead end answers the hand. It is never indexed, and it answers
// 404: a crawler that follows a stale link keeps nothing. (Its header,
// mascot and rising words arrive with the landing's own port.)
import { Meta, Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { HttpStatusCode } from "@solidjs/start"
import { DitherHeatTrail } from "@dither-kit"
import { TRAIL } from "@/pages/landing/plate"

export default function Missing() {
  return (
    <div class="flex min-h-dvh flex-col bg-background font-mono text-foreground antialiased">
      <Title>This page did not print</Title>
      <Meta name="robots" content="noindex" />
      <HttpStatusCode code={404} />
      <main
        id="main"
        tabindex="-1"
        class="relative isolate grid flex-1 place-items-center px-6 pb-24 pt-12 outline-none"
      >
        <DitherHeatTrail class="!absolute inset-0 -z-10" {...TRAIL} cell={4} />
        <div class="flex max-w-xl flex-col items-center gap-5 text-center">
          <h1 class="font-display text-[clamp(1.8rem,4.2vw,3rem)] leading-[1.1] [text-wrap:balance]">
            This page did not print.
          </h1>
          <p class="text-sm text-muted-foreground">
            The link may be old, or the cell it pointed at was never there.{" "}
            <span class="text-foreground">Everything else is where you left it.</span>
          </p>
          <A
            href="/"
            class="inline-flex min-h-10 items-center rounded-md bg-foreground px-4 text-xs text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to the start
          </A>
        </div>
      </main>
    </div>
  )
}
