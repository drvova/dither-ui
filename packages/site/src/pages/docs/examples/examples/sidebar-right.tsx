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
  const calendars = createMutable([
    { label: "Personal", color: "blue", on: true },
    { label: "Work", color: "green", on: true },
    { label: "Family", color: "purple", on: false },
    { label: "Deadlines", color: "red", on: true },
  ] as { label: string; color: "blue" | "green" | "purple" | "red"; on: boolean }[])

  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center justify-between border-b border-border/60 px-3">
            <span class="text-[12px] text-foreground">July 2026</span>
            <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {calendars.filter((c) => c.on).length} calendars shown
            </span>
          </div>
          <div class="grid flex-1 grid-cols-7 gap-px bg-border/40 p-px" aria-hidden="true">
            <For each={Array.from({ length: 35 }, (_, k) => k + 1)}>{() => <div class="bg-background/80" />}</For>
          </div>
        </div>
        <DitherSidebar
          class="w-56 border-l border-border/60 bg-card/20"
          label="Calendar panel"
          side="right"
          collapse="none"
          variant="inset"
          header={
            <div class="flex items-center gap-2.5 px-2.5">
              <DitherAvatar name="Juno Bit" size={24} color="green" />
              <div class="min-w-0 leading-tight">
                <div class="truncate text-[12px] text-foreground">Juno Bit</div>
                <div class="truncate text-[10px] text-muted-foreground">juno@dither-ui.com</div>
              </div>
            </div>
          }
          footer={
            <button
              class="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              type="button"
            >
              <span aria-hidden="true">+</span> New calendar
            </button>
          }
        >
          <DitherSidebarGroup label="Calendar">
            <div class="px-2.5">
              <div class="grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground">
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
          <DitherSidebarGroup label="My calendars">
            <For each={calendars}>
              {(c) => (
                <label class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground">
                  <DitherCheckbox
                    class="text-[11px]"
                    modelValue={c.on}
                    onUpdateModelValue={(v) => (c.on = v)}
                    color={c.color}
                  >
                    {c.label}
                  </DitherCheckbox>
                  <span
                    class="ml-auto size-1.5 rounded-full"
                    style={{ "background-color": `var(--swatch-${c.color}, currentColor)` }}
                    aria-hidden="true"
                  />
                </label>
              )}
            </For>
          </DitherSidebarGroup>
        </DitherSidebar>
      </div>
    </div>
  )
}
