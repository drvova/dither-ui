import { For } from "solid-js"
import { DitherAvatar, Sparkline, type DitherColor } from "@dither-kit"

export default function Example() {
  const team = [
    {
      name: "ada",
      role: "maintainer",
      commits: 284,
      color: "green",
      data: [
        8, 7.8, 11, 13.4, 12.6, 11.9, 12.4, 11.2, 9.5, 11.1, 14.4, 15.1, 14.5, 15.1, 14.9, 12.4, 11.9, 14.7, 16.7, 16.6,
        17.3, 18.2, 16.3, 14,
      ],
    },
    {
      name: "grace",
      role: "charts",
      commits: 197,
      color: "blue",
      data: [
        7.9, 11.3, 13, 11.8, 11.3, 11.6, 10, 8.7, 10.9, 13.9, 14.1, 13.4, 14.1, 13.3, 10.8, 11, 14.1, 15.5, 15.2, 16,
        16.4, 14, 12.3, 14.1,
      ],
    },
    {
      name: "linus",
      role: "engine",
      commits: 151,
      color: "purple",
      data: [
        11.7, 12.7, 11.2, 10.8, 10.9, 9, 8.2, 11, 13.5, 13.1, 12.6, 13.1, 11.7, 9.5, 10.4, 13.5, 14.3, 14, 14.8, 14.7,
        11.9, 10.8, 13.1, 15,
      ],
    },
    {
      name: "barbara",
      role: "docs",
      commits: 96,
      color: "orange",
      data: [
        12.3, 10.6, 10.4, 10.2, 8.2, 8.1, 11.1, 13.1, 12.2, 11.8, 12.1, 10.3, 8.4, 10, 12.9, 13.2, 12.8, 13.7, 12.9,
        10.1, 9.6, 12.2, 13.6, 13.4,
      ],
    },
  ]

  return (
    <div class="mx-auto max-w-md rounded-lg border border-border/60">
      <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span class="text-[11px] text-muted-foreground">dither-ui contributors</span>
        <span class="text-[11px] tabular-nums text-muted-foreground">this quarter</span>
      </div>
      <For each={team}>
        {(m, i) => (
          <div class={`flex items-center gap-3 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
            <DitherAvatar name={m.name} size={32} animate={false} />
            <div class="w-20 min-w-0 sm:w-24">
              <div class="truncate text-[11px] text-foreground/90">{m.name}</div>
              <div class="truncate text-[10px] text-muted-foreground">{m.role}</div>
            </div>
            <Sparkline data={m.data} color={m.color as DitherColor} class="h-5 min-w-0 flex-1" />
            <span class="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{m.commits}</span>
          </div>
        )}
      </For>
    </div>
  )
}
