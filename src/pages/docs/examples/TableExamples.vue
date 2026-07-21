<script setup lang="ts">
import { computed, ref } from "vue"
import { ActiveDot, DitherButton, DitherCheckbox, DitherInput, DitherPagination } from "@dither-kit"
import DemoCard from "../DemoCard.vue"

type Member = { name: string; email: string; role: string; status: "active" | "away" | "offline"; joined: string }
const members = ref<Member[]>([
  { name: "Ada Byte", email: "ada@acme.io", role: "Engineering", status: "active", joined: "2023-01-14" },
  { name: "Rei Toma", email: "rei@acme.io", role: "Design", status: "active", joined: "2023-03-02" },
  { name: "Juno Bit", email: "juno@acme.io", role: "Product", status: "away", joined: "2022-11-20" },
  { name: "Mika Dot", email: "mika@acme.io", role: "Engineering", status: "offline", joined: "2024-02-08" },
  { name: "Kai Raster", email: "kai@acme.io", role: "Support", status: "active", joined: "2023-07-19" },
  { name: "Ivy Pixel", email: "ivy@acme.io", role: "Marketing", status: "away", joined: "2022-05-30" },
  { name: "Sol Bayer", email: "sol@acme.io", role: "Engineering", status: "active", joined: "2024-06-11" },
  { name: "Nia Grid", email: "nia@acme.io", role: "Finance", status: "offline", joined: "2023-09-25" },
  { name: "Rio Halftone", email: "rio@acme.io", role: "Design", status: "active", joined: "2024-01-03" },
])

const query = ref("")
const sortKey = ref<"name" | "joined">("joined")
const sortDir = ref<1 | -1>(-1)
function sortBy(key: "name" | "joined") {
  if (sortKey.value === key) sortDir.value = sortDir.value === 1 ? -1 : 1
  else {
    sortKey.value = key
    sortDir.value = 1
  }
}
const ariaSort = (key: "name" | "joined") =>
  sortKey.value !== key ? "none" : sortDir.value === 1 ? "ascending" : "descending"

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const rows = q
    ? members.value.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    : members.value
  return [...rows].sort((a, b) => a[sortKey.value].localeCompare(b[sortKey.value]) * sortDir.value)
})

const PAGE_SIZE = 5
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => {
  const p = Math.min(page.value, pages.value)
  return filtered.value.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
})
const rangeLabel = computed(() => {
  const total = filtered.value.length
  if (!total) return "No members match"
  const p = Math.min(page.value, pages.value)
  const from = (p - 1) * PAGE_SIZE + 1
  const to = Math.min(p * PAGE_SIZE, total)
  return `Showing ${from}\u2013${to} of ${total}`
})

const selected = ref(new Set<string>())
const allOnPage = computed(() => paged.value.length > 0 && paged.value.every((m) => selected.value.has(m.email)))
function toggleAll() {
  const next = new Set(selected.value)
  if (allOnPage.value) paged.value.forEach((m) => next.delete(m.email))
  else paged.value.forEach((m) => next.add(m.email))
  selected.value = next
}
function toggleRow(email: string) {
  const next = new Set(selected.value)
  if (next.has(email)) next.delete(email)
  else next.add(email)
  selected.value = next
}
function removeSelected() {
  members.value = members.value.filter((m) => !selected.value.has(m.email))
  selected.value = new Set()
}

const STATUS: Record<Member["status"], { color: "green" | "orange" | "grey"; label: string }> = {
  active: { color: "green", label: "Active" },
  away: { color: "orange", label: "Away" },
  offline: { color: "grey", label: "Offline" },
}

const SNIPPET = `<DitherInput v-model="query" placeholder="Filter members…" />

<table class="w-full text-left">
  <thead>
    <tr class="border-b">
      <th><DitherCheckbox :model-value="allOnPage"
        @update:model-value="toggleAll" /></th>
      <th aria-sort="ascending">
        <button @click="sortBy('name')">Name ↑</button>
      </th>
      <th>Role</th>
      <th>Status</th>
      <th><button @click="sortBy('joined')">Joined</button></th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="m in paged" :class="selected.has(m.email) && 'bg-card/50'">
      <td><DitherCheckbox :model-value="selected.has(m.email)"
        @update:model-value="toggleRow(m.email)" /></td>
      <td>{{ m.name }} — {{ m.email }}</td>
      <td>{{ m.role }}</td>
      <td><ActiveDot /> {{ m.status }}</td>   <!-- colored presence dot -->
      <td>{{ m.joined }}</td>
    </tr>
  </tbody>
</table>

<footer class="flex items-center justify-between">
  {{ rangeLabel }}
  <DitherPagination v-model:page="page" :total="pages" />
</footer>

<!-- selection toolbar appears while rows are checked:
     n selected · <DitherButton color="red">Remove</DitherButton> -->`
</script>

<template>
  <section id="table-members" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Data table</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The whole table contract in one block — filter, sortable columns with
      aria-sort, page-scoped select-all, a bulk remove that really removes,
      presence dots, and dithered pagination. Filter and sort compose; the
      range label tells the truth.
    </p>
    <DemoCard :code="SNIPPET">
      <div class="mx-auto max-w-2xl rounded-lg border border-border/60 bg-background/40">
        <div class="flex items-center justify-between gap-3 border-b border-border/60 p-3">
          <div>
            <div class="text-[13px] tracking-tight text-foreground">Team members</div>
            <div class="mt-0.5 text-[11px] text-muted-foreground">Everyone with workspace access.</div>
          </div>
          <DitherInput v-model="query" placeholder="Filter members…" class="w-44 text-[11px]" @update:model-value="page = 1" />
        </div>
        <div
          v-if="selected.size"
          class="flex items-center justify-between border-b border-border/60 bg-card/30 px-3 py-2"
        >
          <span class="text-[11px] tabular-nums text-muted-foreground">{{ selected.size }} selected</span>
          <DitherButton color="red" class="px-2.5 py-1 text-[10px]" @click="removeSelected">Remove</DitherButton>
        </div>
        <table class="w-full text-left text-[11px]">
          <thead>
            <tr class="border-b border-border/60 text-muted-foreground">
              <th class="w-10 px-3 py-2">
                <DitherCheckbox
                  :model-value="allOnPage"
                  aria-label="Select page"
                  @update:model-value="toggleAll"
                />
              </th>
              <th class="py-2 pr-3" :aria-sort="ariaSort('name')">
                <button type="button" class="flex items-center gap-1 transition-colors hover:text-foreground" @click="sortBy('name')">
                  Member
                  <span v-if="sortKey === 'name'" aria-hidden="true">{{ sortDir === 1 ? "↑" : "↓" }}</span>
                </button>
              </th>
              <th class="py-2 pr-3 font-normal">Role</th>
              <th class="py-2 pr-3 font-normal">Status</th>
              <th class="py-2 pr-3" :aria-sort="ariaSort('joined')">
                <button type="button" class="flex items-center gap-1 transition-colors hover:text-foreground" @click="sortBy('joined')">
                  Joined
                  <span v-if="sortKey === 'joined'" aria-hidden="true">{{ sortDir === 1 ? "↑" : "↓" }}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in paged"
              :key="m.email"
              class="border-b border-border/40 transition-colors last:border-0 hover:bg-card/40"
              :class="selected.has(m.email) ? 'bg-card/50' : ''"
            >
              <td class="px-3 py-2">
                <DitherCheckbox
                  :model-value="selected.has(m.email)"
                  :aria-label="`Select ${m.name}`"
                  @update:model-value="toggleRow(m.email)"
                />
              </td>
              <td class="py-2 pr-3">
                <div class="text-foreground">{{ m.name }}</div>
                <div class="text-[10px] text-muted-foreground">{{ m.email }}</div>
              </td>
              <td class="py-2 pr-3 text-muted-foreground">{{ m.role }}</td>
              <td class="py-2 pr-3">
                <span class="inline-flex items-center gap-1.5 text-muted-foreground">
                  <ActiveDot :color="STATUS[m.status].color" :r="2.5" />
                  {{ STATUS[m.status].label }}
                </span>
              </td>
              <td class="py-2 pr-3 tabular-nums text-muted-foreground">{{ m.joined }}</td>
            </tr>
            <tr v-if="!paged.length">
              <td colspan="5" class="px-3 py-8 text-center text-muted-foreground">No members match “{{ query }}”.</td>
            </tr>
          </tbody>
        </table>
        <div class="flex items-center justify-between border-t border-border/60 p-3">
          <span class="text-[10px] tabular-nums text-muted-foreground">{{ rangeLabel }}</span>
          <DitherPagination v-model:page="page" :total="pages" />
        </div>
      </div>
    </DemoCard>
  </section>
</template>
