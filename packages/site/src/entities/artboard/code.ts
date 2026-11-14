// A frame as the files a reader takes away: a Solid component (`.tsx`) in
// their styling system, and the stylesheet it imports when that system
// keeps one (CSS, CSS Modules). One writer for the export dialog and the
// agent's `code.get`.
import type { Artboard } from "@/entities/artboard"
import { restyleSolid, type Sheet, type Styling } from "@dither-ui/restyle"
import { chartCode } from "../chart/model/codegen"
import { widgetCode } from "../widget/model/codegen"

export type FrameCode = { file: string; code: string; sheet: Sheet | null }

/** The frame's name as a file's: `Sign in` is `sign-in`. */
const baseName = (a: Artboard): string => a.name.replace(/[^\w-]+/g, "-").toLowerCase() || "artboard"

export function frameCode(a: Artboard, system: Styling): FrameCode {
  const base = baseName(a)
  const plain = a.widget ? widgetCode(a.widget, { w: a.w, h: a.h }) : chartCode(a.chart)
  return { file: `${base}.tsx`, ...restyleSolid(plain, system, base) }
}

/** Both files as one text to read: the stylesheet under the component,
 * under its file's name (as `restyle(…)` shows one). */
export const shown = (f: FrameCode): string =>
  f.sheet ? `${f.code.replace(/\s+$/, "")}\n\n/* ${f.sheet.file} */\n${f.sheet.text}` : f.code
