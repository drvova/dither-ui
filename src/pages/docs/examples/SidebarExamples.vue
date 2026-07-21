<script setup lang="ts">
import { ref } from "vue"
import {
  DitherAvatar,
  DitherSidebar,
  DitherSidebarGroup,
  DitherSidebarItem,
  DitherSidebarSub,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"

const dashCollapsed = ref(false)
const dashActive = ref("Overview")

const docsActive = ref("Installation")
const docsGuides = ref(true)
const docsApi = ref(false)

const adminHidden = ref(false)
const adminActive = ref("Members")

const SNIPPET_DASHBOARD = `<div class="flex h-96 overflow-hidden rounded-lg border">
  <DitherSidebar v-model="collapsed" variant="washed" wash-color="blue">
    <template #header>…wordmark…</template>
    <DitherSidebarGroup label="Overview">
      <DitherSidebarItem label="Dashboard" :active="active === 'Dashboard'" />
      <DitherSidebarItem label="Reports" :badge="4" />
      <DitherSidebarItem label="Alerts" :badge="2" color="red" />
    </DitherSidebarGroup>
    <DitherSidebarGroup label="Records">
      <DitherSidebarItem label="Customers" />
      <DitherSidebarItem label="Invoices" :badge="12" />
    </DitherSidebarGroup>
    <template #footer>…user row…</template>
  </DitherSidebar>
  <main class="flex-1">…topbar + stat cards…</main>
</div>`

const SNIPPET_DOCS = `<div class="flex h-96 overflow-hidden rounded-lg border">
  <DitherSidebar collapse="none" density="compact" variant="inset">
    <template #header>…project + version…</template>
    <DitherSidebarItem label="Introduction" :active="active === 'Introduction'" />
    <DitherSidebarItem label="Installation" :active="active === 'Installation'" />
    <DitherSidebarSub v-model="guides" label="Guides">
      <DitherSidebarItem label="Theming" />
      <DitherSidebarItem label="Composition" />
    </DitherSidebarSub>
    <DitherSidebarSub v-model="api" label="API">
      <DitherSidebarItem label="Props" />
      <DitherSidebarItem label="Events" />
    </DitherSidebarSub>
  </DitherSidebar>
  <main class="flex-1">…article…</main>
</div>

<!-- collapse="none" — a docs rail never folds to icons;
     density="compact" tightens rows for deep trees -->`

const SNIPPET_ADMIN = `<div class="flex h-96 overflow-hidden rounded-lg border">
  <DitherSidebar v-model="hidden" collapse="hide" variant="floating" :toggle="false">
    <DitherSidebarGroup label="Manage">
      <DitherSidebarItem label="Members" :badge="24" />
      <DitherSidebarItem label="Roles" />
      <DitherSidebarItem label="Audit log" badge="!" color="red" />
    </DitherSidebarGroup>
    <template #footer>
      <DitherAvatar name="Ada Byte" :size="24" />  <!-- profile row -->
      <button aria-label="Sign out">…</button>
    </template>
  </DitherSidebar>
  <main class="flex-1">
    <button @click="hidden = !hidden">☰</button>  <!-- topbar toggle -->
    …table skeleton…
  </main>
</div>`
</script>

<template>
  <!-- Dashboard sidebar -->
  <section id="sidebar-dashboard" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dashboard sidebar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A product dashboard frame — washed sidebar with grouped nav, count
      badges, a user footer, and the icon rail one click away. The stat
      cards are plain tokens; the sidebar carries the identity.
    </p>
    <DemoCard :code="SNIPPET_DASHBOARD">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar v-model="dashCollapsed" label="Dashboard nav" variant="washed" wash-color="blue">
          <template #header>
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <span v-if="!dashCollapsed" class="text-[12px] tracking-tight">acme.io</span>
            </div>
          </template>
          <DitherSidebarGroup label="Overview">
            <DitherSidebarItem label="Dashboard" :active="dashActive === 'Dashboard'" @select="dashActive = 'Dashboard'" />
            <DitherSidebarItem label="Reports" :badge="4" :active="dashActive === 'Reports'" @select="dashActive = 'Reports'" />
            <DitherSidebarItem label="Alerts" :badge="2" color="red" :active="dashActive === 'Alerts'" @select="dashActive = 'Alerts'" />
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Records">
            <DitherSidebarItem label="Customers" :active="dashActive === 'Customers'" @select="dashActive = 'Customers'" />
            <DitherSidebarItem label="Invoices" :badge="12" :active="dashActive === 'Invoices'" @select="dashActive = 'Invoices'" />
          </DitherSidebarGroup>
          <template #footer>
            <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
              <DitherAvatar name="Ada Byte" :size="22" />
              <div v-if="!dashCollapsed" class="min-w-0 leading-tight">
                <div class="truncate text-[11px] text-foreground">Ada Byte</div>
                <div class="truncate text-[10px] text-muted-foreground">ada@acme.io</div>
              </div>
            </div>
          </template>
        </DitherSidebar>
        <main class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center justify-between border-b border-border/60 px-4">
            <span class="text-[12px] text-foreground">{{ dashActive }}</span>
            <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</span>
          </div>
          <div class="grid grid-cols-3 gap-3 p-4">
            <div v-for="s in [['Revenue', '$12,480'], ['Active', '1,204'], ['Churn', '0.8%']]" :key="s[0]" class="rounded-md border border-border/60 p-3">
              <div class="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">{{ s[0] }}</div>
              <div class="mt-1 text-[15px] tabular-nums text-foreground">{{ s[1] }}</div>
            </div>
          </div>
          <div class="mx-4 mb-4 flex-1 rounded-md border border-dashed border-border/60" aria-hidden="true" />
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- Docs sidebar -->
  <section id="sidebar-docs" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Docs sidebar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A documentation rail — compact rows, nested sections that fold, no icon
      rail (a docs tree needs its labels). The version chip lives in the
      header; the article keeps reading width.
    </p>
    <DemoCard :code="SNIPPET_DOCS">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar label="Docs nav" collapse="none" density="compact" variant="inset" class="border-r border-border/60">
          <template #header>
            <div class="flex h-8 items-center justify-between px-2.5">
              <span class="text-[12px] tracking-tight">dither-ui</span>
              <span class="rounded border border-border/60 px-1 text-[10px] tabular-nums text-muted-foreground">v2.4</span>
            </div>
          </template>
          <DitherSidebarItem label="Introduction" :active="docsActive === 'Introduction'" @select="docsActive = 'Introduction'" />
          <DitherSidebarItem label="Installation" :active="docsActive === 'Installation'" @select="docsActive = 'Installation'" />
          <DitherSidebarSub v-model="docsGuides" label="Guides">
            <DitherSidebarItem label="Theming" :active="docsActive === 'Theming'" @select="docsActive = 'Theming'" />
            <DitherSidebarItem label="Composition" :active="docsActive === 'Composition'" @select="docsActive = 'Composition'" />
            <DitherSidebarItem label="Motion" :active="docsActive === 'Motion'" @select="docsActive = 'Motion'" />
          </DitherSidebarSub>
          <DitherSidebarSub v-model="docsApi" label="API">
            <DitherSidebarItem label="Props" :active="docsActive === 'Props'" @select="docsActive = 'Props'" />
            <DitherSidebarItem label="Events" :active="docsActive === 'Events'" @select="docsActive = 'Events'" />
          </DitherSidebarSub>
        </DitherSidebar>
        <main class="min-w-0 flex-1 overflow-hidden p-5">
          <div class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Docs / {{ docsActive }}</div>
          <div class="mt-2 text-[15px] tracking-tight text-foreground">{{ docsActive }}</div>
          <div class="mt-4 grid gap-2" aria-hidden="true">
            <div class="h-2 w-11/12 rounded-sm bg-border/50" />
            <div class="h-2 w-full rounded-sm bg-border/50" />
            <div class="h-2 w-3/4 rounded-sm bg-border/50" />
            <div class="mt-3 h-20 rounded-md border border-border/60 bg-background/40" />
            <div class="h-2 w-5/6 rounded-sm bg-border/50" />
            <div class="h-2 w-2/3 rounded-sm bg-border/50" />
          </div>
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- Admin sidebar -->
  <section id="sidebar-admin" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Admin sidebar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A floating admin panel that hides entirely — the topbar hamburger owns
      the toggle, the footer carries the signed-in profile and a sign-out.
      Alert badges stay red so triage reads at a glance.
    </p>
    <DemoCard :code="SNIPPET_ADMIN">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar v-model="adminHidden" label="Admin nav" collapse="hide" variant="floating" :toggle="false">
          <template #header>
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <span class="text-[12px] tracking-tight">admin</span>
            </div>
          </template>
          <DitherSidebarGroup label="Manage">
            <DitherSidebarItem label="Members" :badge="24" :active="adminActive === 'Members'" @select="adminActive = 'Members'" />
            <DitherSidebarItem label="Roles" :active="adminActive === 'Roles'" @select="adminActive = 'Roles'" />
            <DitherSidebarItem label="Invites" :badge="3" color="green" :active="adminActive === 'Invites'" @select="adminActive = 'Invites'" />
          </DitherSidebarGroup>
          <DitherSidebarGroup label="System">
            <DitherSidebarItem label="Audit log" badge="!" color="red" :active="adminActive === 'Audit log'" @select="adminActive = 'Audit log'" />
            <DitherSidebarItem label="Settings" :active="adminActive === 'Settings'" @select="adminActive = 'Settings'" />
          </DitherSidebarGroup>
          <template #footer>
            <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
              <DitherAvatar name="Rei Toma" :size="22" color="purple" />
              <div class="min-w-0 flex-1 leading-tight">
                <div class="truncate text-[11px] text-foreground">Rei Toma</div>
                <div class="truncate text-[10px] text-muted-foreground">Owner</div>
              </div>
              <button
                type="button"
                aria-label="Sign out"
                class="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <span aria-hidden="true" class="text-[11px]">⏻</span>
              </button>
            </div>
          </template>
        </DitherSidebar>
        <main class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center gap-3 border-b border-border/60 px-3">
            <button
              type="button"
              class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              :aria-label="adminHidden ? 'Show sidebar' : 'Hide sidebar'"
              :aria-expanded="!adminHidden"
              @click="adminHidden = !adminHidden"
            >
              <span aria-hidden="true" class="text-[13px] leading-none">☰</span>
            </button>
            <span class="text-[12px] text-foreground">{{ adminActive }}</span>
          </div>
          <div class="grid gap-2 p-4" aria-hidden="true">
            <div class="flex h-8 items-center gap-3 rounded-md border border-border/60 px-3" v-for="i in 5" :key="i">
              <span class="size-3 rounded-[2px] bg-border/70" />
              <span class="h-2 rounded-sm bg-border/50" :class="['w-1/3', 'w-1/4', 'w-2/5', 'w-1/3', 'w-1/5'][i - 1]" />
              <span class="ml-auto h-2 w-10 rounded-sm bg-border/40" />
            </div>
          </div>
        </main>
      </div>
    </DemoCard>
  </section>
</template>
