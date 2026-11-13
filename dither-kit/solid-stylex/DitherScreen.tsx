// Generated from ../solid/DitherScreen.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import type { ParentProps } from "solid-js"
import type { ScreenKind } from "../engine/pixel"
import { ScreenContext } from "../solid/runtime/screen"

export type DitherScreenProps = ParentProps<{ screen?: ScreenKind }>

/** Prints everything inside it through one screen: every pixel surface and
 * chart below it reads its threshold matrix from here, so a line, hatch,
 * dot or cross screen replaces the Bayer pattern without a prop on each. */
export default function DitherScreen(props: DitherScreenProps) {
  return <ScreenContext.Provider value={() => props.screen ?? "diagonal"}>{props.children}</ScreenContext.Provider>
}
