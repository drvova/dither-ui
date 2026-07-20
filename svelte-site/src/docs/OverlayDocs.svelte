<script lang="ts">
  import {
    DitherAvatar,
    DitherBadge,
    DitherButton,
    DitherContextMenu,
    DitherMenu,
    DitherMenubar,
    DitherPopover,
    DitherPreviewCard,
    DitherTooltip,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  let popoverOpen = $state(false)

  const MENU_ITEMS = [
    { label: "New" },
    { label: "Duplicate" },
    { divider: true },
    { label: "Delete", danger: true },
  ]
  let menuAction = $state("none")

  const CTX_ITEMS = [
    { label: "Cut" },
    { label: "Copy" },
    { label: "Paste" },
    { divider: true },
    { label: "Delete", danger: true },
  ]
  let ctxAction = $state("none")

  const MENUBAR = [
    {
      label: "File",
      items: [{ label: "New" }, { label: "Open" }, { label: "Save" }],
    },
    {
      label: "Edit",
      items: [{ label: "Undo" }, { label: "Redo" }, { label: "Find" }],
    },
    {
      label: "View",
      items: [{ label: "Zoom in" }, { label: "Zoom out" }],
    },
  ]
  let lastAction = $state("none")

  const SNIPPET_POPOVER = `<script lang="ts">
  let open = $state(false)
<\/script>

<DitherPopover open={open} align="center" onclose={() => (open = false)}>
  {#snippet trigger()}
    <DitherButton onclick={() => (open = !open)}>Open popover</DitherButton>
  {/snippet}
  <p class="text-[12px] leading-relaxed text-muted-foreground">
    Anchored to its trigger — Escape or an outside press closes it.
  </p>
</DitherPopover>`

  const SNIPPET_MENU = `<script lang="ts">
  const items = [
    { label: "New" },
    { label: "Duplicate" },
    { divider: true },
    { label: "Delete", danger: true },
  ]
<\/script>

<DitherMenu {items} onselect={(label) => run(label)}>
  Actions
</DitherMenu>`

  const SNIPPET_CONTEXT = `<script lang="ts">
  const items = [
    { label: "Cut" },
    { label: "Copy" },
    { label: "Paste" },
    { divider: true },
    { label: "Delete", danger: true },
  ]
<\/script>

<DitherContextMenu {items} onselect={(label) => run(label)}>
  <div class="rounded-lg border border-dashed border-border p-10">
    right-click me
  </div>
</DitherContextMenu>`

  const SNIPPET_MENUBAR = `<script lang="ts">
  const menus = [
    { label: "File", items: [{ label: "New" }, { label: "Open" }, { label: "Save" }] },
    { label: "Edit", items: [{ label: "Undo" }, { label: "Redo" }, { label: "Find" }] },
    { label: "View", items: [{ label: "Zoom in" }, { label: "Zoom out" }] },
  ]
  let last = $state("none")
<\/script>

<DitherMenubar {menus} onselect={(m, i) => (last = \`\${m} → \${i}\`)} />
<p class="mt-3 text-[12px] text-muted-foreground">last action: {last}</p>`

  const SNIPPET_TOOLTIP = `<DitherTooltip text="Deploys are frozen until Monday">
  <DitherBadge color="orange">frozen</DitherBadge>
</DitherTooltip>`

  const SNIPPET_PREVIEW = `<DitherPreviewCard>
  {#snippet trigger()}
    <span class="underline decoration-border underline-offset-4" tabindex="0">
      @ada
    </span>
  {/snippet}
  <div class="flex items-center gap-3">
    <DitherAvatar name="Ada Lovelace" size={40} />
    <div>
      <p class="text-[13px]">Ada Lovelace</p>
      <p class="text-[11px] text-muted-foreground">Wrote the first program.</p>
    </div>
  </div>
</DitherPreviewCard>`

  const API: Record<string, PropRow[]> = {
    popover: [
      { prop: "open", type: "boolean", default: "—" },
      { prop: "align", type: '"start" | "center" | "end"', default: '"start"' },
    ],
    menu: [{ prop: "items", type: "MenuItem[]", default: "—" }],
    contextMenu: [{ prop: "items", type: "ContextMenuItem[]", default: "—" }],
    menubar: [
      {
        prop: "menus",
        type: "{ label: string; items: MenubarItem[] }[]",
        default: "—",
      },
    ],
    tooltip: [
      { prop: "text", type: "string", default: "—" },
      { prop: "delay", type: "number", default: "300" },
    ],
    previewCard: [{ prop: "delay", type: "number", default: "400" }],
  }
</script>

<section id="popover" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Popover</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    An anchored panel below its trigger — bring your own trigger and content.
    Escape or an outside press emits close.
  </p>
  <DemoCard code={SNIPPET_POPOVER}>
    <div class="flex justify-center">
      <DitherPopover open={popoverOpen} align="center" onclose={() => (popoverOpen = false)}>
        {#snippet trigger()}
          <DitherButton onclick={() => (popoverOpen = !popoverOpen)}>
            Open popover
          </DitherButton>
        {/snippet}
        <p class="text-[12px] leading-relaxed text-muted-foreground">
          Anchored to its trigger — Escape or an outside press closes it.
        </p>
      </DitherPopover>
    </div>
  </DemoCard>
  <PropsTable rows={API.popover} />
</section>

<section id="menu" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Menu</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A dropdown menu behind a single button — arrow keys move focus, Enter
    selects, Escape closes and refocuses the trigger.
  </p>
  <DemoCard code={SNIPPET_MENU}>
    <div class="flex flex-col items-center gap-3">
      <DitherMenu items={MENU_ITEMS} onselect={(label) => (menuAction = label)}>
        Actions
      </DitherMenu>
      <p class="text-[12px] text-muted-foreground">
        last action: {menuAction}
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.menu} />
</section>

<section id="context-menu" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Context Menu</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A right-click menu teleported to the pointer — same items and keyboard
    behavior as Menu, dismissed by Escape or any outside press.
  </p>
  <DemoCard code={SNIPPET_CONTEXT}>
    <div class="flex flex-col items-center gap-3">
      <DitherContextMenu items={CTX_ITEMS} onselect={(label) => (ctxAction = label)}>
        <div
          class="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground select-none"
        >
          right-click me
        </div>
      </DitherContextMenu>
      <p class="text-[12px] text-muted-foreground">
        last action: {ctxAction}
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.contextMenu} />
</section>

<section id="menubar" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Menubar</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A desktop-style horizontal bar — one menu open at a time, hover switches
    between top items, ArrowLeft/Right move across them.
  </p>
  <DemoCard code={SNIPPET_MENUBAR}>
    <div class="flex flex-col items-center gap-3">
      <DitherMenubar menus={MENUBAR} onselect={(m, i) => (lastAction = `${m} → ${i}`)} />
      <p class="text-[12px] text-muted-foreground">
        last action: {lastAction}
      </p>
    </div>
  </DemoCard>
  <PropsTable rows={API.menubar} />
</section>

<section id="tooltip" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Tooltip</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A delayed hover tip above its target — also shows on focus, hides on
    leave, blur, or Escape. No transition under reduced motion.
  </p>
  <DemoCard code={SNIPPET_TOOLTIP}>
    <div class="flex justify-center">
      <DitherTooltip text="Deploys are frozen until Monday">
        <DitherBadge color="orange">frozen</DitherBadge>
      </DitherTooltip>
    </div>
  </DemoCard>
  <PropsTable rows={API.tooltip} />
</section>

<section id="preview-card" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Preview Card</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A hover preview for rich content — opens after a delay on hover or focus;
    a short close delay lets the pointer travel into the card.
  </p>
  <DemoCard code={SNIPPET_PREVIEW}>
    <div class="flex justify-center">
      <DitherPreviewCard>
        {#snippet trigger()}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex (focusable hover-card trigger; the card opens on focus) -->
          <span
            class="cursor-pointer text-[13px] underline decoration-border underline-offset-4"
            tabindex="0"
          >
            @ada
          </span>
        {/snippet}
        <div class="flex items-center gap-3">
          <DitherAvatar name="Ada Lovelace" size={40} />
          <div>
            <p class="text-[13px] text-foreground">Ada Lovelace</p>
            <p class="text-[11px] text-muted-foreground">
              Wrote the first program.
            </p>
          </div>
        </div>
      </DitherPreviewCard>
    </div>
  </DemoCard>
  <PropsTable rows={API.previewCard} />
</section>
