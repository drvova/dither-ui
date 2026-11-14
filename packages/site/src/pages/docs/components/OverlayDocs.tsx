import { createSignal, onCleanup, onMount } from "solid-js"
import {
  DitherAvatar,
  DitherButton,
  DitherCommand,
  DitherContextMenu,
  DitherMenu,
  DitherMenubar,
  DitherPreviewCard,
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import popoverProps from "virtual:dither-props/DitherPopover"
import menuProps from "virtual:dither-props/DitherMenu"
import contextMenuProps from "virtual:dither-props/DitherContextMenu"
import menubarProps from "virtual:dither-props/DitherMenubar"
import tooltipProps from "virtual:dither-props/DitherTooltip"
import previewCardProps from "virtual:dither-props/DitherPreviewCard"
import commandProps from "virtual:dither-props/DitherCommand"
import DocSection from "../DocSection"
import PopoverExample from "./examples/popover"
import popoverCode from "./examples/popover.tsx?raw"
import TooltipExample from "./examples/tooltip"
import tooltipCode from "./examples/tooltip.tsx?raw"

const COMMAND_ITEMS = [
  { value: "new-artboard", label: "New artboard", group: "Studio", kbd: "N" },
  { value: "export-image", label: "Export image", group: "Studio", kbd: "⇧E" },
  { value: "open-docs", label: "Open docs", group: "Navigate" },
  { value: "open-studio", label: "Open studio", group: "Navigate" },
  { value: "toggle-theme", label: "Toggle theme", group: "Preferences" },
]

const MENU_ITEMS = [{ label: "New" }, { label: "Duplicate" }, { divider: true }, { label: "Delete", danger: true }]

const CTX_ITEMS = [
  { label: "Cut" },
  { label: "Copy" },
  { label: "Paste" },
  { divider: true },
  { label: "Delete", danger: true },
]

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

const SNIPPET_MENU = `const items = [
  { label: "New" },
  { label: "Duplicate" },
  { divider: true },
  { label: "Delete", danger: true },
]
const [last, setLast] = createSignal("none")

<DitherMenu items={items} onSelect={(label) => (setLast(label))}>
  Actions
</DitherMenu>
<p class="mt-3 text-[12px] text-muted-foreground">last action: {last()}</p>`

const SNIPPET_CONTEXT = `const items = [
  { label: "Cut" },
  { label: "Copy" },
  { label: "Paste" },
  { divider: true },
  { label: "Delete", danger: true },
]
const [last, setLast] = createSignal("none")

<DitherContextMenu items={items} onSelect={(label) => (setLast(label))}>
  <div class="rounded-lg border border-dashed border-border p-10">
    right-click me
  </div>
</DitherContextMenu>
<p class="mt-3 text-[12px] text-muted-foreground">last action: {last()}</p>`

const SNIPPET_MENUBAR = `const menus = [
  { label: "File", items: [{ label: "New" }, { label: "Open" }, { label: "Save" }] },
  { label: "Edit", items: [{ label: "Undo" }, { label: "Redo" }, { label: "Find" }] },
  { label: "View", items: [{ label: "Zoom in" }, { label: "Zoom out" }] },
]
const [last, setLast] = createSignal("none")

<DitherMenubar menus={menus} onSelect={(m, i) => (setLast(\`\${m} → \${i}\`))} />
<p class="mt-3 text-[12px] text-muted-foreground">last action: {last()}</p>`

const SNIPPET_COMMAND = `const [open, setOpen] = createSignal(false)
const [ran, setRan] = createSignal("nothing yet")
// the hotkey stays yours
function hotkey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") (e.preventDefault(), setOpen(!open()))
}
onMount(() => window.addEventListener("keydown", hotkey))
onCleanup(() => window.removeEventListener("keydown", hotkey))

<DitherButton onClick={() => setOpen(true)}>Command (⌘K)</DitherButton>
<DitherCommand
  open={open()}
  items={[
    { value: 'new', label: 'New artboard', group: 'Studio', kbd: 'N' },
    { value: 'export', label: 'Export image', group: 'Studio' },
    { value: 'docs', label: 'Open docs', group: 'Navigate' },
  ]}
  onSelect={(value) => (setRan(value))}
  onClose={() => setOpen(false)}
/>
<p class="text-[10px] text-muted-foreground">last ran: {ran()}</p>

{/* type to filter, the arrows walk, Enter runs, Escape leaves */}`

const SNIPPET_PREVIEW = `<DitherPreviewCard
  trigger={
    <button type="button" class="underline decoration-border underline-offset-4">@ada</button>
  }
>
  <div class="flex items-center gap-3">
    <DitherAvatar name="Ada Lovelace" size={40} />
    <div>
      <p class="text-[13px]">Ada Lovelace</p>
      <p class="text-[11px] text-muted-foreground">Wrote the first program.</p>
    </div>
  </div>
</DitherPreviewCard>`

export const API: Record<string, PropRow[]> = {
  popover: kitTable(popoverProps),
  menu: kitTable(menuProps),
  contextMenu: kitTable(contextMenuProps),
  menubar: kitTable(menubarProps),
  tooltip: kitTable(tooltipProps),
  previewCard: kitTable(previewCardProps),
  command: kitTable(commandProps),
}

export default function OverlayDocs() {
  /* Command palette: open state, catalog, last run, and a real hotkey. */
  const [commandOpen, setCommandOpen] = createSignal(false)
  const [commandRan, setCommandRan] = createSignal("none")
  function commandHotkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setCommandOpen(!commandOpen())
    }
  }
  onMount(() => {
    window.addEventListener("keydown", commandHotkey)
    onCleanup(() => window.removeEventListener("keydown", commandHotkey))
  })

  const [menuAction, setMenuAction] = createSignal("none")
  const [ctxAction, setCtxAction] = createSignal("none")
  const [lastAction, setLastAction] = createSignal("none")

  return (
    <>
      <DocSection id="popover">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An anchored panel below its trigger. Bring your own trigger and content. Escape or an outside press calls
          onClose.
        </p>
        <DemoCard code={popoverCode}>
          <div class="flex justify-center">
            <PopoverExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.popover} />
      </DocSection>

      <DocSection id="menu">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A dropdown menu behind a single button: arrow keys move focus, Enter selects, Escape closes and refocuses the
          trigger.
        </p>
        <DemoCard code={SNIPPET_MENU}>
          <div class="flex flex-col items-center gap-3">
            <DitherMenu items={MENU_ITEMS} onSelect={(label) => setMenuAction(label)}>
              Actions
            </DitherMenu>
            <p class="text-[12px] text-muted-foreground">last action: {menuAction()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.menu} />
      </DocSection>

      <DocSection id="context-menu">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A right-click menu portalled to the pointer. It shares Menu's items and keyboard behavior, and Escape or any
          outside press dismisses it.
        </p>
        <DemoCard code={SNIPPET_CONTEXT}>
          <div class="flex flex-col items-center gap-3">
            <DitherContextMenu items={CTX_ITEMS} onSelect={(label) => setCtxAction(label)}>
              <div class="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground select-none">
                right-click me
              </div>
            </DitherContextMenu>
            <p class="text-[12px] text-muted-foreground">last action: {ctxAction()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.contextMenu} />
      </DocSection>

      <DocSection id="menubar">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A desktop-style horizontal bar: one menu open at a time, hover switches between top items, ArrowLeft/Right
          move across them.
        </p>
        <DemoCard code={SNIPPET_MENUBAR}>
          <div class="flex flex-col items-center gap-3">
            <DitherMenubar menus={MENUBAR} onSelect={(m, i) => setLastAction(`${m} → ${i}`)} />
            <p class="text-[12px] text-muted-foreground">last action: {lastAction()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.menubar} />
      </DocSection>

      <DocSection id="tooltip">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A delayed hover tip above its target. It also shows on focus and hides on leave, blur, or Escape. No
          transition under reduced motion.
        </p>
        <DemoCard code={tooltipCode}>
          <div class="flex justify-center">
            <TooltipExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.tooltip} />
      </DocSection>

      <DocSection id="preview-card">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A hover preview for rich content. It opens after a delay on hover or focus, and a short close delay lets the
          pointer travel into the card.
        </p>
        <DemoCard code={SNIPPET_PREVIEW}>
          <div class="flex justify-center">
            <DitherPreviewCard
              trigger={
                <button type="button" class="text-[13px] underline decoration-border underline-offset-4">
                  @ada
                </button>
              }
            >
              <div class="flex items-center gap-3">
                <DitherAvatar name="Ada Lovelace" size={40} />
                <div>
                  <p class="text-[13px] text-foreground">Ada Lovelace</p>
                  <p class="text-[11px] text-muted-foreground">Wrote the first program.</p>
                </div>
              </div>
            </DitherPreviewCard>
          </div>
        </DemoCard>
        <PropsTable rows={API.previewCard} />
      </DocSection>

      <DocSection id="command">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The ⌘K palette: type to filter, arrows to walk, Enter runs, Escape leaves. Groups follow first appearance; the
          hotkey stays in your hands. Try ⌘K right here.
        </p>
        <DemoCard code={SNIPPET_COMMAND}>
          <div class="grid min-h-28 place-items-center gap-3">
            <DitherButton color="blue" class="px-3 py-1.5 text-[12px]" onClick={() => setCommandOpen(true)}>
              Command (⌘K)
            </DitherButton>
            <p class="text-[10px] text-muted-foreground">last ran: {commandRan()}</p>
            <DitherCommand
              open={commandOpen()}
              items={COMMAND_ITEMS}
              onSelect={setCommandRan}
              onClose={() => setCommandOpen(false)}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.command} />
      </DocSection>
    </>
  )
}
