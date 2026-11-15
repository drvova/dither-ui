import { For, Show } from "solid-js"
import { cssColor, DitherAvatar } from "@dither-kit"

const FEED = [
  { name: "ada", text: "pushed to dither-engine", time: "2m", unread: true },
  { name: "grace", text: "opened #128 dithered tooltips", time: "14m", unread: true },
  { name: "linus", text: "released v0.2.0", time: "1h", unread: false },
  { name: "barbara", text: "commented on #124", time: "3h", unread: false },
  { name: "alan", text: "merged #122 radar sparkles", time: "5h", unread: false },
]

export default function Example() {
  return (
    <div class="mx-auto max-w-md rounded-lg border border-border/60 text-left">
      <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span class="text-[11px] text-muted-foreground">dither-ui activity</span>
        <span class="text-[11px] tabular-nums text-muted-foreground">today</span>
      </div>
      <For each={FEED}>
        {(row, i) => (
          <div class={`flex items-center gap-3 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
            <DitherAvatar name={row.name} size={24} animate={false} />
            <span class="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
              <span class="text-foreground/90">{row.name}</span> {row.text}
            </span>
            <Show when={row.unread}>
              <span class="size-1.5 shrink-0 rounded-full" style={{ "background-color": cssColor("blue") }} />
            </Show>
            <span class="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{row.time}</span>
          </div>
        )}
      </For>
    </div>
  )
}
