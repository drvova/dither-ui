// A full-screen sheet's head (the menu, the docs' sections): the header
// itself, standing where it stood, so opening a sheet moves nothing but
// the key that opened it, which turns to "Close" in its place under the
// close mark, an X in the brand's pixel. What the
// sheet is may stand in the middle (`children`). The close key is the
// sheet's first stop.
import type { JSX } from "solid-js"
import { CLOSE_CELLS, SHEET_HEAD_FOOT } from "@/widgets/site-header/menu"
import BrandMark from "../../shared/ui/BrandMark"

type SheetHeadProps = {
  /** The close key's full name: "Close menu", "Close sections". */
  closeLabel: string
  onClose?: () => void
  children?: JSX.Element
}

export default function SheetHead(props: SheetHeadProps) {
  return (
    <div class="site-head sheet-head" style={{ "padding-bottom": `${SHEET_HEAD_FOOT}px` }}>
      <div class="site-capsule text-xs">
        <span class="flex h-8 items-center gap-2.5 whitespace-nowrap pl-2">
          <BrandMark size={13} />
          <span class="max-[359px]:sr-only">dither-ui</span>
        </span>
        {props.children}
        <button
          type="button"
          class="nav-a menu-key"
          aria-label={props.closeLabel}
          autofocus
          onClick={() => props.onClose?.()}
        >
          <BrandMark cells={CLOSE_CELLS} size={14} />
          <span class="max-[359px]:sr-only" aria-hidden="true">
            Close
          </span>
        </button>
      </div>
    </div>
  )
}
