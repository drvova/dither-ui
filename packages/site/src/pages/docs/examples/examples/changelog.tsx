import { For, Show } from "solid-js"
import { cssColor } from "@dither-kit"

const RELEASES = [
  { version: "v0.3.0", title: "Interactive docs playgrounds", date: "today", tags: ["docs", "charts"] },
  { version: "v0.2.0", title: "Motion, bloom and replay", date: "last week", tags: [] },
  { version: "v0.1.0", title: "First public dither", date: "Jan", tags: [] },
]

export default function Example() {
  return (
    <div class="mx-auto max-w-md text-left">
      <For each={RELEASES}>
        {(r, i) => (
          <div class="flex gap-3">
            <div class="flex flex-col items-center">
              <span
                class={`mt-1 size-2 shrink-0 rounded-[2px] ${i() === 0 ? "" : "bg-border"}`}
                style={i() === 0 ? { "background-color": cssColor("green") } : {}}
              />
              <Show when={i() < RELEASES.length - 1}>
                <span class="w-px flex-1 bg-border/60" />
              </Show>
            </div>
            <div class={i() < RELEASES.length - 1 ? "pb-6" : ""}>
              <div class="flex items-baseline gap-2">
                <span class="text-[11px] text-foreground/90">{r.version}</span>
                <span class="text-[10px] text-muted-foreground">{r.date}</span>
              </div>
              <div class="mt-0.5 text-[13px] tracking-tight">{r.title}</div>
              <Show when={r.tags.length}>
                <div class="mt-2 flex gap-1.5">
                  <For each={r.tags}>
                    {(tag) => (
                      <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {tag}
                      </span>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
