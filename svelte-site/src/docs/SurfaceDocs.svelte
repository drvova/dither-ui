<script lang="ts">
  import {
    cssColor,
    DitherAccordion,
    DitherAlertDialog,
    DitherButton,
    DitherDrawer,
    DitherMeter,
    DitherNavMenu,
    DitherScrollArea,
    DitherSeparator,
    DitherSidebar,
    DitherSidebarGroup,
    DitherSidebarItem,
    DitherSidebarSub,
    DitherSwipeArea,
    DitherSwitch,
    DitherToaster,
    DitherToolbar,
  } from "@dither-kit-svelte"
  import { toast } from "../../../dither-kit-svelte/runtime/toast.svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  const FAQ = [
    { value: "what", title: "What is dithering?" },
    { value: "why", title: "Why canvas?" },
    { value: "copy", title: "Can I copy the kit out?" },
  ]
  let faq = $state<string | string[]>("what")

  let alertOpen = $state(false)
  let lastChoice = $state("nothing yet")

  let drawerOpen = $state(false)
  let gridSnap = $state(true)
  let showRulers = $state(false)
  let sheetOpen = $state(false)
  let snapOpen = $state(false)
  let snapAt = $state<number | undefined>(0.35)
  const SNAPS = [0.35, 0.75]
  let sheetActions = $state(false)
  let lastAction = $state("none")
  const ACTIONS = ["Duplicate", "Rename", "Export PNG", "Move to group"]
  let nestedOpen = $state(false)
  let nestedChild = $state(false)
  let swipeAreaOn = $state(false)
  let swipeDrawer = $state(false)

  let sidebarActive = $state("Overview")
  let sidebarCollapsed = $state(false)
  let sidebarSubOpen = $state(true)
  const SIDEBAR_VARIANTS = ["default", "floating", "inset", "washed"] as const
  let variantActive = $state("Overview")
  let modeActive = $state("Overview")

  const NAV_ITEMS = [
    { label: "Overview" },
    { label: "Components" },
    { label: "Pricing" },
    { label: "Docs" },
  ]
  let navActive = $state("Overview")

  const METERS = [
    { label: "Disk", value: 35 },
    { label: "Memory", value: 68 },
    { label: "CPU", value: 92 },
  ]

  const SNIPPET_ACCORDION = `<script lang="ts">
  let faq = $state("what")
  const items = [
    { value: "what", title: "What is dithering?" },
    { value: "why", title: "Why canvas?" },
    { value: "copy", title: "Can I copy the kit out?" },
  ]
<\/script>

<DitherAccordion bind:value={faq} {items} type="single" color="blue">
  {#snippet what()}
    Ordered dithering trades smooth gradients for a fixed threshold
    matrix — the same Bayer 4x4 behind every fill in this kit.
  {/snippet}
  {#snippet why()}
    One engine paints every fill, so components stay coherent.
  {/snippet}
  {#snippet copy()}
    Yes — the kit folder has zero app imports; copy it and alias it.
  {/snippet}
</DitherAccordion>`

  const SNIPPET_ALERT_DIALOG = `<script lang="ts">
  let open = $state(false)
<\/script>

<DitherButton color="red" onclick={() => (open = true)}>Delete artboard…</DitherButton>
<DitherAlertDialog
  open={open}
  danger
  title="Delete artboard?"
  description="This removes the artboard and its layers. There is no undo across sessions."
  confirmLabel="Delete"
  onconfirm={() => (open = false)}
  oncancel={() => (open = false)}
/>`

  const SNIPPET_DRAWER = `<!-- side drawers swipe-dismiss along their axis;
     bottom sheets get a handle and dismiss downward -->
<DitherDrawer open={open} side="right" title="Settings" onclose={() => (open = false)}>
  …
</DitherDrawer>
<DitherDrawer open={sheet} side="bottom" title="Notifications" onclose={() => (sheet = false)} />

<!-- nesting: a child drawer pushes its parent back automatically -->
<DitherDrawer open={account} title="Account" onclose={() => (account = false)}>
  <DitherDrawer open={security} title="Security" onclose={() => (security = false)} />
</DitherDrawer>

<!-- swipe-to-open from the viewport edge -->
<DitherSwipeArea side="right" onopen={() => (open = true)} />

<!-- snap points: vh fractions or px; flicks can skip points -->
<DitherDrawer bind:snapPoint={snap} open={open} side="bottom"
  snapPoints={[0.35, 0.75]} onclose={() => (open = false)} />

<!-- indent: your app scales back while any drawer is open -->
<DitherDrawerIndent>
  <App />
</DitherDrawerIndent>`

  const SNIPPET_SIDEBAR = `<DitherSidebar bind:collapsed={collapsed} variant="default" collapse="rail">
  {#snippet header()}…wordmark…{/snippet}

  <DitherSidebarGroup label="Platform">   <!-- label folds to a hairline on the rail -->
    <DitherSidebarItem label="Overview" active={active === "Overview"} />
    <DitherSidebarItem label="Charts" badge={12} />  <!-- badge folds to a dot -->
  </DitherSidebarGroup>

  <DitherSidebarGroup label="Library">
    <DitherSidebarSub bind:open={subOpen} label="Components">
      <DitherSidebarItem label="Buttons" />
      <DitherSidebarItem label="Forms" />
    </DitherSidebarSub>
  </DitherSidebarGroup>
</DitherSidebar>

<!-- variant: default | floating | inset | washed (dither gradient chrome)
     collapse: rail | hide | none · side: left | right
     density: default | compact · toggle={false} = permanent rail -->`

  const SNIPPET_TOAST = `<script lang="ts">
  import { DitherToaster } from "@dither-kit-svelte"
  import { toast } from "dither-kit-svelte/runtime/toast.svelte"
<\/script>

<DitherToaster />
<DitherButton color="green" onclick={() => toast("Saved", { color: "green" })}>
  Save
</DitherButton>
<DitherButton color="red" onclick={() => toast("Export failed", { color: "red" })}>
  Export
</DitherButton>`

  const SNIPPET_METER = `<div class="grid gap-3">
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>Disk</span><span>35%</span>
    </div>
    <DitherMeter value={35} />
  </div>
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>Memory</span><span>68%</span>
    </div>
    <DitherMeter value={68} />
  </div>
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>CPU</span><span>92%</span>
    </div>
    <DitherMeter value={92} />
  </div>
</div>`

  const SNIPPET_SCROLL_AREA = `<DitherScrollArea class="h-40 rounded-lg border border-border/60 p-3">
  {#each Array.from({ length: 15 }, (_, i) => i + 1) as n (n)}
    <p class="py-1 text-[12px] text-muted-foreground">
      Log line {n} — ordered dither keeps the texture coherent.
    </p>
  {/each}
</DitherScrollArea>`

  const SNIPPET_TOOLBAR = `<DitherToolbar label="Formatting">
  <DitherButton class="px-2.5 py-1" aria-label="Bold">B</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Italic">I</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Underline">U</DitherButton>
  <DitherSeparator orientation="vertical" class="mx-1 h-5" />
  <DitherButton class="px-2.5 py-1" aria-label="Align left">⇤</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Align center">⇹</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Align right">⇥</DitherButton>
</DitherToolbar>`

  const SNIPPET_NAV_MENU = `<script lang="ts">
  let active = $state("Overview")
  const items = [
    { label: "Overview" },
    { label: "Components" },
    { label: "Pricing" },
    { label: "Docs" },
  ]
<\/script>

<DitherNavMenu bind:value={active} {items} color="blue" />
<p class="mt-4 text-[12px] text-muted-foreground">Viewing: {active}</p>`

  const API: Record<string, PropRow[]> = {
    accordion: [
      { prop: "items", type: "{ value: string; title: string }[]", default: "—" },
      { prop: "value", type: "string | string[]", default: "—" },
      { prop: "type", type: '"single" | "multiple"', default: '"single"' },
      { prop: "color", type: "PixelColor", default: '"blue"' },
    ],
    alertDialog: [
      { prop: "open", type: "boolean", default: "—" },
      { prop: "title", type: "string", default: "—" },
      { prop: "description", type: "string", default: "undefined" },
      { prop: "confirmLabel", type: "string", default: '"Confirm"' },
      { prop: "cancelLabel", type: "string", default: '"Cancel"' },
      { prop: "danger", type: "boolean", default: "false" },
    ],
    drawer: [
      { prop: "open", type: "boolean", default: "—" },
      { prop: "side", type: '"right" | "left" | "bottom"', default: '"right"' },
      { prop: "title", type: "string", default: "undefined" },
      { prop: "swipe", type: "boolean — drag to dismiss, momentum decides", default: "true" },
      { prop: "snapPoints", type: "number[] — ≤1 vh fraction, >1 px (bottom)", default: "undefined" },
      { prop: "snapPoint", type: "number — bind:snapPoint", default: "first snap" },
      { prop: "modal", type: "boolean — false: no backdrop, page stays live", default: "true" },
      { prop: "dismissible", type: "boolean — false: backdrop click ignored", default: "true" },
    ],
    sidebar: [
      { prop: "collapsed (Sidebar)", type: "boolean — bind:collapsed", default: "false" },
      { prop: "variant (Sidebar)", type: '"default" | "floating" | "inset" | "washed"', default: '"default"' },
      { prop: "collapse (Sidebar)", type: '"rail" | "hide" | "none"', default: '"rail"' },
      { prop: "side (Sidebar)", type: '"left" | "right"', default: '"left"' },
      { prop: "density (Sidebar)", type: '"default" | "compact"', default: '"default"' },
      { prop: "toggle (Sidebar)", type: "boolean — false: permanent rail", default: "true" },
      { prop: "washColor (Sidebar)", type: 'PixelColor — for variant="washed"', default: '"blue"' },
      { prop: "label (Group)", type: "string — folds to a hairline on the rail", default: "undefined" },
      { prop: "label / active / color (Item)", type: "string / boolean / PixelColor", default: '— / false / "blue"' },
      { prop: "badge (Item)", type: "string | number — dot on the rail", default: "undefined" },
      { prop: "open / label (Sub)", type: "boolean (bind:open) / string", default: "false / —" },
    ],
    toast: [
      { prop: "message", type: "string", default: "—" },
      { prop: "opts.color", type: "PixelColor", default: '"blue"' },
      { prop: "opts.duration", type: "number", default: "3500" },
    ],
    meter: [
      { prop: "value", type: "number", default: "—" },
      { prop: "min", type: "number", default: "0" },
      { prop: "max", type: "number", default: "100" },
      { prop: "low", type: "number", default: "0.5" },
      { prop: "high", type: "number", default: "0.8" },
    ],
    scrollArea: [{ prop: "class", type: "string", default: "undefined" }],
    toolbar: [{ prop: "label", type: "string", default: "undefined" }],
    navMenu: [
      { prop: "items", type: "{ label: string; href?: string }[]", default: "—" },
      { prop: "value", type: "string", default: "—" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
    ],
  }
</script>

<section id="accordion" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Accordion</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A stack of disclosure rows animated through grid-template-rows, each with
    the 2px dithered rail. Single type closes siblings on open.
  </p>
  <DemoCard code={SNIPPET_ACCORDION}>
    <div class="mx-auto max-w-sm">
      <DitherAccordion bind:value={faq} items={FAQ} type="single" color="blue">
        {#snippet what()}
          Ordered dithering trades smooth gradients for a fixed threshold
          matrix — the same Bayer 4x4 behind every fill in this kit.
        {/snippet}
        {#snippet why()}
          One engine paints every fill, so components stay coherent.
        {/snippet}
        {#snippet copy()}
          Yes — the kit folder has zero app imports; copy it and alias it.
        {/snippet}
      </DitherAccordion>
    </div>
  </DemoCard>
  <PropsTable rows={API.accordion} />
</section>

<section id="alert-dialog" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Alert Dialog</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A modal that demands an answer — overlay clicks do nothing, Escape
    cancels, and focus lands on the safe Cancel button. Danger seeds the
    confirm fill red.
  </p>
  <DemoCard code={SNIPPET_ALERT_DIALOG}>
    <div class="flex flex-col items-center gap-4">
      <DitherButton color="red" onclick={() => (alertOpen = true)}>
        Delete artboard…
      </DitherButton>
      <p class="text-[12px] text-muted-foreground">Last choice: {lastChoice}</p>
      <DitherAlertDialog
        open={alertOpen}
        danger
        title="Delete artboard?"
        description="This removes the artboard and its layers. There is no undo across sessions."
        confirmLabel="Delete"
        onconfirm={() => {
          alertOpen = false
          lastChoice = "confirmed"
        }}
        oncancel={() => {
          alertOpen = false
          lastChoice = "cancelled"
        }}
      />
    </div>
  </DemoCard>
  <PropsTable rows={API.alertDialog} />
</section>

<section id="drawer" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Drawer</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A side panel that slides in over a scrim — Escape or scrim click closes,
    the close button takes focus on open.
  </p>
  <DemoCard code={SNIPPET_DRAWER}>
    <div class="flex flex-wrap justify-center gap-3">
      <DitherButton onclick={() => (drawerOpen = true)}>Open settings</DitherButton>
      <DitherButton color="purple" onclick={() => (sheetOpen = true)}>Bottom sheet</DitherButton>
      <DitherButton color="pink" onclick={() => { snapOpen = true; snapAt = 0.35 }}>Snap points</DitherButton>
      <DitherButton color="orange" onclick={() => (sheetActions = true)}>Action sheet</DitherButton>
      <DitherButton color="green" onclick={() => (nestedOpen = true)}>Nested</DitherButton>
      <DitherDrawer
        open={drawerOpen}
        side="right"
        title="Settings"
        onclose={() => (drawerOpen = false)}
      >
        <p class="pb-2 text-[11px] text-muted-foreground">Swipe the panel right to dismiss.</p>
        <div class="flex items-center justify-between py-2 text-[13px]">
          <span>Snap to grid</span>
          <DitherSwitch bind:value={gridSnap} label="Snap to grid" color="green" />
        </div>
        <div class="flex items-center justify-between py-2 text-[13px]">
          <span>Show rulers</span>
          <DitherSwitch bind:value={showRulers} label="Show rulers" />
        </div>
      </DitherDrawer>
      <DitherDrawer open={sheetOpen} side="bottom" title="Notifications" onclose={() => (sheetOpen = false)}>
        <p class="text-[13px] text-muted-foreground">
          You are all caught up. Drag the handle down to dismiss — a flick
          counts through its momentum, a slow drag settles back.
        </p>
      </DitherDrawer>
      <DitherDrawer
        bind:snapPoint={snapAt}
        open={snapOpen}
        side="bottom"
        title="Snap points"
        snapPoints={SNAPS}
        onclose={() => (snapOpen = false)}
      >
        <p class="text-[13px] text-muted-foreground">
          Resting at <span class="text-foreground tabular-nums">{Math.round((snapAt ?? 0.35) * 100)}vh</span>.
          Drag the handle up for the tall snap, down to the short one — a
          flick's momentum can skip straight past a point. Below half the
          smallest snap, it dismisses.
        </p>
      </DitherDrawer>
      <DitherDrawer open={sheetActions} side="bottom" title="Artboard" onclose={() => (sheetActions = false)}>
        <div class="grid gap-1 pb-2">
          {#each ACTIONS as a (a)}
            <button
              type="button"
              class="rounded-md px-3 py-2 text-left text-[13px] text-foreground/90 transition-colors hover:bg-background"
              onclick={() => { lastAction = a; sheetActions = false }}
            >
              {a}
            </button>
          {/each}
          <div class="my-1 h-px bg-border/60"></div>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-background"
            style:color={cssColor("red")}
            onclick={() => { lastAction = "Delete"; sheetActions = false }}
          >
            Delete artboard
          </button>
        </div>
      </DitherDrawer>
      <p class="w-full text-center text-[11px] text-muted-foreground">last action: {lastAction}</p>
      <DitherDrawer open={nestedOpen} side="right" title="Account" onclose={() => (nestedOpen = false)}>
        <p class="pb-3 text-[13px] text-muted-foreground">
          Opening a child pushes this drawer back — scaled, dimmed, out of
          reach until the child closes.
        </p>
        <DitherButton color="green" onclick={() => (nestedChild = true)}>Security settings</DitherButton>
        <DitherDrawer open={nestedChild} side="right" title="Security" onclose={() => (nestedChild = false)}>
          <p class="text-[13px] text-muted-foreground">
            Independently focus-managed; Escape closes just this one.
          </p>
        </DitherDrawer>
      </DitherDrawer>
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">swipe to open</h3>
  <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
    <p class="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
      <code class="text-foreground/80">DitherSwipeArea</code> is an invisible
      strip on the viewport edge — arm it, then swipe inward from the right
      edge of your screen to open the drawer.
    </p>
    <div class="flex items-center gap-2 text-[12px]">
      <span class="text-muted-foreground">arm edge</span>
      <DitherSwitch bind:value={swipeAreaOn} label="Arm swipe area" color="purple" />
    </div>
    {#if swipeAreaOn}
      <DitherSwipeArea side="right" onopen={() => (swipeDrawer = true)} />
    {/if}
    <DitherDrawer open={swipeDrawer} side="right" title="From the edge" onclose={() => (swipeDrawer = false)}>
      <p class="text-[13px] text-muted-foreground">Opened by an edge swipe.</p>
    </DitherDrawer>
  </div>
  <PropsTable rows={API.drawer} />
</section>

<section id="sidebar" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Sidebar</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    An app sidebar that collapses to an icon rail — items keep their hit
    area, labels fold away, the active item carries a dithered rail.
  </p>
  <DemoCard code={SNIPPET_SIDEBAR}>
    <div class="mx-auto flex h-80 max-w-md overflow-hidden rounded-lg border border-border/60">
      <DitherSidebar bind:collapsed={sidebarCollapsed} label="Demo sidebar">
        {#snippet header()}
          <div class="flex h-8 items-center gap-2 px-2.5">
            <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground"></span>
            {#if !sidebarCollapsed}<span class="text-[12px] tracking-tight">dither-ui</span>{/if}
          </div>
        {/snippet}
        <DitherSidebarGroup label="Platform">
          <DitherSidebarItem label="Overview" active={sidebarActive === "Overview"} onselect={() => (sidebarActive = "Overview")} />
          <DitherSidebarItem label="Charts" badge={12} active={sidebarActive === "Charts"} onselect={() => (sidebarActive = "Charts")} />
          <DitherSidebarItem label="Alerts" badge={3} color="red" active={sidebarActive === "Alerts"} onselect={() => (sidebarActive = "Alerts")} />
        </DitherSidebarGroup>
        <DitherSidebarGroup label="Library">
          <DitherSidebarSub bind:open={sidebarSubOpen} label="Components">
            <DitherSidebarItem label="Buttons" active={sidebarActive === "Buttons"} onselect={() => (sidebarActive = "Buttons")} />
            <DitherSidebarItem label="Forms" active={sidebarActive === "Forms"} onselect={() => (sidebarActive = "Forms")} />
          </DitherSidebarSub>
          <DitherSidebarItem label="Palette" active={sidebarActive === "Palette"} onselect={() => (sidebarActive = "Palette")} />
        </DitherSidebarGroup>
      </DitherSidebar>
      <div class="grid flex-1 place-items-center text-[12px] text-muted-foreground">
        {sidebarActive}
      </div>
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
  <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
    {#each SIDEBAR_VARIANTS as v (v)}
      <div>
        <div class="flex h-44 overflow-hidden rounded-lg border border-border/60 {v === 'inset' ? 'bg-card/30 p-1.5' : ''}">
          <DitherSidebar variant={v} collapse="none" washColor={v === "washed" ? "purple" : undefined} label={`${v} sidebar`} class="w-32">
            {#each ["Overview", "Charts", "Palette"] as item (item)}
              <DitherSidebarItem
                label={item}
                color={v === "washed" ? "purple" : "blue"}
                active={variantActive === item}
                onselect={() => (variantActive = item)}
              />
            {/each}
          </DitherSidebar>
          <div class="min-w-0 flex-1 {v === 'inset' ? 'm-1.5 rounded-md border border-border/60 bg-background' : ''}"></div>
        </div>
        <div class="mt-2 text-center text-[10px] text-muted-foreground">{v}</div>
      </div>
    {/each}
  </div>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">modes</h3>
  <div class="mt-4 grid gap-4 sm:grid-cols-2">
    <div>
      <div class="flex h-48 overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar collapse="none" density="compact" label="Compact sidebar" class="w-36">
          <DitherSidebarGroup label="Files">
            {#each ["index.ts", "palette.ts", "pixel.ts", "gesture.ts", "lib.ts"] as item (item)}
              <DitherSidebarItem
                label={item}
                active={modeActive === item}
                onselect={() => (modeActive = item)}
              />
            {/each}
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="min-w-0 flex-1"></div>
      </div>
      <div class="mt-2 text-center text-[10px] text-muted-foreground">density="compact"</div>
    </div>
    <div>
      <div class="flex h-48 overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar collapse="rail" collapsed={true} toggle={false} label="Permanent rail">
          {#each ["Overview", "Charts", "Alerts"] as item (item)}
            <DitherSidebarItem
              label={item}
              badge={item === "Alerts" ? 2 : undefined}
              color={item === "Alerts" ? "red" : "blue"}
              active={modeActive === item}
              onselect={() => (modeActive = item)}
            />
          {/each}
        </DitherSidebar>
        <div class="grid min-w-0 flex-1 place-items-center text-[11px] text-muted-foreground">{modeActive}</div>
      </div>
      <div class="mt-2 text-center text-[10px] text-muted-foreground">permanent rail · toggle=&lbrace;false&rbrace;</div>
    </div>
  </div>
  <PropsTable rows={API.sidebar} />
</section>

<section id="toast" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Toast</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A module-level toast() call feeds a teleported bottom-right stack; each
    toast carries a 3px dithered rail in its color and dismisses itself after
    its duration. API table below documents the toast() function.
  </p>
  <DemoCard code={SNIPPET_TOAST}>
    <div class="flex justify-center gap-3">
      <DitherToaster />
      <DitherButton color="green" onclick={() => toast("Saved", { color: "green" })}>
        Save
      </DitherButton>
      <DitherButton color="red" onclick={() => toast("Export failed", { color: "red" })}>
        Export
      </DitherButton>
    </div>
  </DemoCard>
  <PropsTable rows={API.toast} />
</section>

<section id="meter" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Meter</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A static gauge on the progress track — the fill seed picks itself: green
    below the low mark, orange between, red above the high mark.
  </p>
  <DemoCard code={SNIPPET_METER}>
    <div class="mx-auto grid max-w-sm gap-3">
      {#each METERS as m (m.label)}
        <div>
          <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{m.label}</span><span>{m.value}%</span>
          </div>
          <DitherMeter value={m.value} />
        </div>
      {/each}
    </div>
  </DemoCard>
  <PropsTable rows={API.meter} />
</section>

<section id="scroll-area" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Scroll Area</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    An honest overflow container — no canvas, just thin token-colored
    scrollbars that match the house border.
  </p>
  <DemoCard code={SNIPPET_SCROLL_AREA}>
    <DitherScrollArea class="mx-auto h-40 max-w-sm rounded-lg border border-border/60 p-3">
      {#each Array.from({ length: 15 }, (_, i) => i + 1) as n (n)}
        <p class="py-1 text-[12px] text-muted-foreground">
          Log line {n} — ordered dither keeps the texture coherent.
        </p>
      {/each}
    </DitherScrollArea>
  </DemoCard>
  <PropsTable rows={API.scrollArea} />
</section>

<section id="toolbar" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Toolbar</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A roving-tabindex strip — one Tab stop for the whole bar, arrow keys walk
    the buttons, Home and End jump to the edges.
  </p>
  <DemoCard code={SNIPPET_TOOLBAR}>
    <div class="flex justify-center">
      <DitherToolbar label="Formatting">
        <DitherButton class="px-2.5 py-1" aria-label="Bold">B</DitherButton>
        <DitherButton class="px-2.5 py-1" aria-label="Italic">I</DitherButton>
        <DitherButton class="px-2.5 py-1" aria-label="Underline">U</DitherButton>
        <DitherSeparator orientation="vertical" class="mx-1 h-5" />
        <DitherButton class="px-2.5 py-1" aria-label="Align left">⇤</DitherButton>
        <DitherButton class="px-2.5 py-1" aria-label="Align center">⇹</DitherButton>
        <DitherButton class="px-2.5 py-1" aria-label="Align right">⇥</DitherButton>
      </DitherToolbar>
    </div>
  </DemoCard>
  <PropsTable rows={API.toolbar} />
</section>

<section id="nav-menu" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Navigation Menu</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    DitherTabs' sliding dithered underline with nav semantics — anchors
    instead of tabs, aria-current on the active page.
  </p>
  <DemoCard code={SNIPPET_NAV_MENU}>
    <div class="mx-auto max-w-sm">
      <DitherNavMenu bind:value={navActive} items={NAV_ITEMS} color="blue" />
      <p class="mt-4 text-[12px] text-muted-foreground">Viewing: {navActive}</p>
    </div>
  </DemoCard>
  <PropsTable rows={API.navMenu} />
</section>
