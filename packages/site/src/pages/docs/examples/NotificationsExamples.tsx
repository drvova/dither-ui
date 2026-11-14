import { createMemo, createSignal, For, Show } from "solid-js"
import { createMutable } from "solid-js/store"
import { DitherAvatar, DitherBadge, DitherTabs } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { dataCode } from "../snippet"
import DocSection from "../DocSection"

type Notice = {
  id: number
  actor: string
  color: "green" | "purple" | "blue" | "orange"
  action: string
  target: string
  time: string
  day: "Today" | "Earlier"
  read: boolean
}

const NOTICES: Notice[] = [
  {
    id: 1,
    actor: "Rei Toma",
    color: "purple",
    action: "commented on",
    target: "Palette v3",
    time: "12m",
    day: "Today",
    read: false,
  },
  {
    id: 2,
    actor: "Kai Raster",
    color: "green",
    action: "assigned you",
    target: "Export bug #214",
    time: "1h",
    day: "Today",
    read: false,
  },
  {
    id: 3,
    actor: "Nia Grid",
    color: "blue",
    action: "approved",
    target: "Q3 budget",
    time: "3h",
    day: "Today",
    read: true,
  },
  {
    id: 4,
    actor: "Ivy Pixel",
    color: "orange",
    action: "mentioned you in",
    target: "Launch notes",
    time: "1d",
    day: "Earlier",
    read: false,
  },
  {
    id: 5,
    actor: "Sol Bayer",
    color: "green",
    action: "merged",
    target: "dither-kit #98",
    time: "2d",
    day: "Earlier",
    read: true,
  },
  {
    id: 6,
    actor: "Juno Bit",
    color: "blue",
    action: "invited you to",
    target: "Print run review",
    time: "3d",
    day: "Earlier",
    read: true,
  },
]

const SNIPPET = `${dataCode("start", NOTICES)}
const [notices, setNotices] = createSignal(start)
const [tab, setTab] = createSignal("All")

const unread = createMemo(() => notices().filter((n) => !n.read).length)
const shown = createMemo(() => (tab() === "Unread" ? notices().filter((n) => !n.read) : notices()))
const days = createMemo(() => ["Today", "Earlier"].filter((d) => shown().some((n) => n.day === d)))
const byDay = (day: string) => shown().filter((n) => n.day === day)

function read(id: number) {
  setNotices(notices().map((n) => (n.id === id ? { ...n, read: true } : n)))
}
function markAll() {
  setNotices(notices().map((n) => ({ ...n, read: true })))
}

<div class="w-full max-w-80 rounded-lg border">
  <header class="flex items-center justify-between border-b p-3 text-[12px]">
    <span>Notifications <Show when={unread()}><DitherBadge color="green">{unread()}</DitherBadge></Show></span>
    <button type="button" class="text-[10px]" disabled={!unread()} onClick={markAll}>Mark all read</button>
  </header>

  <DitherTabs modelValue={tab()} onUpdateModelValue={setTab} tabs={['All', 'Unread']} variant="segmented" class="p-2" />

  <For each={days()}>
    {(day) => (
      <section>
        <h3 class="px-3 text-[10px] text-muted-foreground">{day}</h3>
        <For each={byDay(day)}>
          {(n) => (
            <button type="button" onClick={() => read(n.id)}
              class="flex w-full items-start gap-2 p-2 text-left text-[11px]">
              <DitherAvatar name={n.actor} size={24} color={n.color} />
              <span class="flex-1"><b>{n.actor}</b> {n.action} <b>{n.target}</b>
                <time class="block text-[10px]">{n.time}</time></span>
              {/* the unread dot */}
              <Show when={!n.read}><span class="size-1.5 rounded-full bg-accent" /></Show>
            </button>
          )}
        </For>
      </section>
    )}
  </For>

  {/* the empty state */}
  <Show when={!shown().length}><p class="p-3 text-[11px]">All caught up.</p></Show>
</div>`

export default function NotificationsExamples() {
  const notices = createMutable<Notice[]>(NOTICES.map((n) => ({ ...n })))

  const [tab, setTab] = createSignal("All")

  const unreadCount = createMemo(() => notices.filter((n) => !n.read).length)

  const shown = createMemo(() => (tab() === "Unread" ? notices.filter((n) => !n.read) : notices))

  const days = createMemo(() => (["Today", "Earlier"] as const).filter((d) => shown().some((n) => n.day === d)))

  const byDay = (d: Notice["day"]) => shown().filter((n) => n.day === d)

  function markAll() {
    notices.forEach((n) => (n.read = true))
  }

  return (
    <>
      <DocSection id="notification-center">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A notification center: segmented All/Unread tabs, day groups, and an unread dot that clears on click or all at
          once. Empty the unread tab and it says so instead of showing nothing.
        </p>
        <DemoCard code={SNIPPET}>
          <div class="mx-auto w-full max-w-80 rounded-lg border border-border/60 bg-background/40">
            <div class="flex items-center justify-between border-b border-border/60 p-3">
              <span class="flex items-center gap-2 text-[12px] text-foreground">
                Notifications{" "}
                <Show when={unreadCount()}>
                  <DitherBadge class="text-[9px]" color="green">
                    {unreadCount()}
                  </DitherBadge>
                </Show>
              </span>
              <button
                class="text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                type="button"
                disabled={!unreadCount()}
                onClick={markAll}
              >
                Mark all read
              </button>
            </div>
            <div class="px-3 pt-2.5">
              <DitherTabs
                class="text-[11px]"
                modelValue={tab()}
                onUpdateModelValue={setTab}
                tabs={["All", "Unread"]}
                variant="segmented"
              />
            </div>
            <div class="max-h-72 overflow-y-auto p-1.5">
              <For each={days()}>
                {(day) => (
                  <section class="mt-1.5 first:mt-0">
                    <h3 class="px-2 pb-1 text-[11px] text-muted-foreground">{day}</h3>
                    <For each={byDay(day)}>
                      {(n) => (
                        <button
                          class={`flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-card/60 ${n.read ? "" : "bg-card/40"}`}
                          type="button"
                          onClick={() => (n.read = true)}
                        >
                          <DitherAvatar class="mt-0.5 shrink-0" name={n.actor} size={24} color={n.color} />
                          <span class="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                            <span class="text-foreground">{n.actor}</span> {n.action}{" "}
                            <span class="text-foreground">{n.target}</span>
                            <time class="ml-1 text-[9px] text-muted-foreground tabular-nums">{n.time}</time>
                          </span>
                          <Show when={!n.read}>
                            <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          </Show>
                          <Show when={!n.read}>
                            <span class="sr-only">unread</span>
                          </Show>
                        </button>
                      )}
                    </For>
                  </section>
                )}
              </For>
              <Show when={!shown().length}>
                <p class="px-2 py-8 text-center text-[11px] text-muted-foreground">All caught up.</p>
              </Show>
            </div>
            <div class="border-t border-border/60 p-2">
              <button
                class="w-full rounded-md py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                type="button"
              >
                View archive
              </button>
            </div>
          </div>
        </DemoCard>
      </DocSection>
    </>
  )
}
