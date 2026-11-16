import type { JSX } from "solid-js"
import { iconSymbols } from "../engine/icons"

/** Stamps the whole set as `<symbol>` sheets once (id: `di-icon-<Name>`) for
 * consumers who want `<use href="#di-icon-Name">` instead of repeated inline
 * svgs — one DOM cost for many glyphs. Renders hidden and aria-hidden; mount
 * it once near the app root and wrap the app in `<IconSprite.Provider
 * value="">` so every `DitherIcon` under it uses the sheet. `DitherIcon`
 * needs no sprite and works standalone, so this is opt-in, not a
 * prerequisite. `class` and other attrs fall through to the svg. */
export type IconSetProps = Omit<JSX.SvgSVGAttributes<SVGSVGElement>, "children">

const FOCUSABLE = { "attr:focusable": "false" }

export default function IconSet(props: IconSetProps) {
  return <svg aria-hidden="true" style={{ display: "none" }} {...FOCUSABLE} {...props} innerHTML={iconSymbols()} />
}
