import { createMutable } from "solid-js/store"
import { For } from "solid-js"
import { DitherAvatar, DitherCheckbox, DitherSidebar, DitherSidebarGroup } from "@dither-kit"

/* Personal dashboard + Right side: mini calendar */
const CAL_LEAD = 2 // month opens on a Wednesday

const CAL_DAYS = 31

const CAL_TODAY = 21

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

export default function Example() {
  const calCells = Array.from({ length: CAL_LEAD + CAL_DAYS }, (_, i) => (i < CAL_LEAD ? null : i - CAL_LEAD + 1))
  const personal = createMutable([
    { label: "Morning walk", done: true },
    { label: "Read 30 minutes", done: false },
    { label: "Water the plants", done: true },
    { label: "Plan weekend trip", done: false },
  ])
  const work = createMutable([
    { label: "Team standup", done: true },
    { label: "Review pull requests", done: false },
    { label: "Prepare demo", done: false },
  ])

  // the month opens on a Wednesday: two blank cells, then 31 days
  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar
          class="w-60 border-r border-border/60"
          label="Personal hub"
          collapse="none"
          variant="inset"
          header={
            <div class="flex items-center gap-2.5 px-2.5">
              <DitherAvatar name="Mika Dot" size={26} color="purple" />
              <div class="min-w-0 leading-tight">
                <div class="truncate text-[12px] text-foreground">Personal hub</div>
                <div class="truncate text-[10px] text-muted-foreground">Organize your day</div>
              </div>
            </div>
          }
          footer={
            <div class="flex items-center gap-1.5 border-t border-border/60 px-2.5 pt-2 text-[10px] text-muted-foreground">
              <span class="size-1.5 rounded-full bg-green-500/80" aria-hidden="true" />{" "}
              {[...personal, ...work].filter((t) => t.done).length} of {personal.length + work.length} done, synced
            </div>
          }
        >
          <DitherSidebarGroup label="Calendar">
            <div class="px-2.5">
              <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                <button
                  class="grid size-5 place-items-center rounded hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <span class="text-[11px]">Jul 2026</span>
                <button
                  class="grid size-5 place-items-center rounded hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
              <div class="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground">
                <For each={DOW}>{(d) => <span>{d}</span>}</For>
              </div>
              <div class="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-[10px] tabular-nums">
                <For each={calCells}>
                  {(day) => (
                    <span
                      class={`grid h-5 place-items-center rounded-[3px] ${
                        day === CAL_TODAY
                          ? "bg-card text-foreground ring-1 ring-border"
                          : day
                            ? "text-muted-foreground"
                            : ""
                      }`}
                    >
                      {day ?? ""}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Personal">
            <For each={personal}>
              {(t) => (
                <label class="flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[11px] transition-colors hover:bg-card/60">
                  <DitherCheckbox
                    class="text-[11px]"
                    modelValue={t.done}
                    onUpdateModelValue={(v) => (t.done = v)}
                    color="purple"
                  >
                    <span class={t.done ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                      {t.label}
                    </span>
                  </DitherCheckbox>
                </label>
              )}
            </For>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Work">
            <For each={work}>
              {(t) => (
                <label class="flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[11px] transition-colors hover:bg-card/60">
                  <DitherCheckbox
                    class="text-[11px]"
                    modelValue={t.done}
                    onUpdateModelValue={(v) => (t.done = v)}
                    color="green"
                  >
                    <span class={t.done ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                      {t.label}
                    </span>
                  </DitherCheckbox>
                </label>
              )}
            </For>
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">
          Stay organized, stay focused
        </div>
      </div>
    </div>
  )
}
