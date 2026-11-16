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
import MenuExample from "./examples/menu"
import menuCode from "./examples/menu.tsx?raw"
import ContextMenuExample from "./examples/context-menu"
import contextMenuCode from "./examples/context-menu.tsx?raw"
import MenubarExample from "./examples/menubar"
import menubarCode from "./examples/menubar.tsx?raw"
import PreviewCardExample from "./examples/preview-card"
import previewCardCode from "./examples/preview-card.tsx?raw"
import CommandExample from "./examples/command"
import commandCode from "./examples/command.tsx?raw"

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
        <DemoCard code={menuCode}>
          <MenuExample />
        </DemoCard>
        <PropsTable rows={API.menu} />
      </DocSection>

      <DocSection id="context-menu">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A right-click menu portalled to the pointer. It shares Menu's items and keyboard behavior, and Escape or any
          outside press dismisses it.
        </p>
        <DemoCard code={contextMenuCode}>
          <ContextMenuExample />
        </DemoCard>
        <PropsTable rows={API.contextMenu} />
      </DocSection>

      <DocSection id="menubar">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A desktop-style horizontal bar: one menu open at a time, hover switches between top items, ArrowLeft/Right
          move across them.
        </p>
        <DemoCard code={menubarCode}>
          <MenubarExample />
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
        <DemoCard code={previewCardCode}>
          <PreviewCardExample />
        </DemoCard>
        <PropsTable rows={API.previewCard} />
      </DocSection>

      <DocSection id="command">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The ⌘K palette: type to filter, arrows to walk, Enter runs, Escape leaves. Groups follow first appearance; the
          hotkey stays in your hands. Try ⌘K right here.
        </p>
        <DemoCard code={commandCode}>
          <CommandExample />
        </DemoCard>
        <PropsTable rows={API.command} />
      </DocSection>
    </>
  )
}
