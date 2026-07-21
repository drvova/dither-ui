<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { DitherAvatar, DitherBadge, DitherTabs } from "@dither-kit"
import DemoCard from "../DemoCard.vue"

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

const notices = reactive<Notice[]>([
  { id: 1, actor: "Rei Toma", color: "purple", action: "commented on", target: "Palette v3", time: "12m", day: "Today", read: false },
  { id: 2, actor: "Kai Raster", color: "green", action: "assigned you", target: "Export bug #214", time: "1h", day: "Today", read: false },
  { id: 3, actor: "Nia Grid", color: "blue", action: "approved", target: "Q3 budget", time: "3h", day: "Today", read: true },
  { id: 4, actor: "Ivy Pixel", color: "orange", action: "mentioned you in", target: "Launch notes", time: "1d", day: "Earlier", read: false },
  { id: 5, actor: "Sol Bayer", color: "green", action: "merged", target: "dither-kit #98", time: "2d", day: "Earlier", read: true },
  { id: 6, actor: "Juno Bit", color: "blue", action: "invited you to", target: "Print run review", time: "3d", day: "Earlier", read: true },
])

const tab = ref("All")
const unreadCount = computed(() => notices.filter((n) => !n.read).length)
const shown = computed(() => (tab.value === "Unread" ? notices.filter((n) => !n.read) : notices))
const days = computed(() => (["Today", "Earlier"] as const).filter((d) => shown.value.some((n) => n.day === d)))
const byDay = (d: Notice["day"]) => shown.value.filter((n) => n.day === d)
function markAll() {
  notices.forEach((n) => (n.read = true))
}

const SNIPPET = `<div class="w-80 rounded-lg border">
  <header class="flex items-center justify-between border-b p-3">
    Notifications <DitherBadge v-if="unread" color="green">{{ unread }}</DitherBadge>
    <button @click="markAll">Mark all read</button>
  </header>

  <DitherTabs v-model="tab" :tabs="['All', 'Unread']" variant="segmented" />

  <section v-for="day in days">
    <h4>{{ day }}</h4>
    <button v-for="n in byDay(day)" @click="n.read = true"
      class="flex w-full items-start gap-2 p-2 text-left">
      <DitherAvatar :name="n.actor" :size="24" :color="n.color" />
      <span><b>{{ n.actor }}</b> {{ n.action }} <b>{{ n.target }}</b>
        <time>{{ n.time }}</time></span>
      <span v-if="!n.read" class="size-1.5 rounded-full bg-accent" />  <!-- unread dot -->
    </button>
  </section>

  <p v-if="!shown.length">All caught up.</p>   <!-- empty state -->
</div>`
</script>

<template>
  <section id="notification-center" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Notifications</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A notification center — segmented All/Unread tabs, day groups, and an
      unread dot that clears on click or all at once. Empty the unread tab
      and it says so instead of showing nothing.
    </p>
    <DemoCard :code="SNIPPET">
      <div class="mx-auto w-80 rounded-lg border border-border/60 bg-background/40">
        <div class="flex items-center justify-between border-b border-border/60 p-3">
          <span class="flex items-center gap-2 text-[12px] text-foreground">
            Notifications
            <DitherBadge v-if="unreadCount" color="green" class="text-[9px]">{{ unreadCount }}</DitherBadge>
          </span>
          <button
            type="button"
            class="text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            :disabled="!unreadCount"
            @click="markAll"
          >
            Mark all read
          </button>
        </div>
        <div class="px-3 pt-2.5">
          <DitherTabs v-model="tab" :tabs="['All', 'Unread']" variant="segmented" class="text-[11px]" />
        </div>
        <div class="max-h-72 overflow-y-auto p-1.5">
          <section v-for="day in days" :key="day" class="mt-1.5 first:mt-0">
            <h4 class="px-2 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">{{ day }}</h4>
            <button
              v-for="n in byDay(day)"
              :key="n.id"
              type="button"
              class="flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-card/60"
              :class="n.read ? 'opacity-70' : ''"
              @click="n.read = true"
            >
              <DitherAvatar :name="n.actor" :size="24" :color="n.color" class="mt-0.5 shrink-0" />
              <span class="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                <span class="text-foreground">{{ n.actor }}</span>
                {{ n.action }}
                <span class="text-foreground">{{ n.target }}</span>
                <time class="ml-1 text-[9px] text-muted-foreground/70 tabular-nums">{{ n.time }}</time>
              </span>
              <span
                v-if="!n.read"
                class="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span v-if="!n.read" class="sr-only">unread</span>
            </button>
          </section>
          <p v-if="!shown.length" class="px-2 py-8 text-center text-[11px] text-muted-foreground">
            All caught up.
          </p>
        </div>
        <div class="border-t border-border/60 p-2">
          <button type="button" class="w-full rounded-md py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
            View archive
          </button>
        </div>
      </div>
    </DemoCard>
  </section>
</template>
