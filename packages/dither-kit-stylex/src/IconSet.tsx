// Generated from dither-kit/solid/IconSet.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For, type JSX } from "solid-js"
import { ICONS } from "dither-kit/engine/icons.ts"

/** Stamps the whole set as `<symbol>` sheets once (id: `di-icon-<Name>`) for
 * consumers who want `<use href="#di-icon-Name">` instead of repeated inline
 * svgs — one DOM cost for many glyphs. Renders hidden and aria-hidden; mount
 * it once near the app root. `DitherIcon` needs no sprite and works
 * standalone, so this is opt-in, not a prerequisite. `class` and other attrs
 * fall through to the svg. */
export type IconSetProps = Omit<JSX.SvgSVGAttributes<SVGSVGElement>, "children">

const FOCUSABLE = { "attr:focusable": "false" }
const names = Object.keys(ICONS) as Array<keyof typeof ICONS>

export default function IconSet(props: IconSetProps) {
  return (
    <svg aria-hidden="true" style={{ display: "none" }} {...FOCUSABLE} {...props}>
      <For each={names}>
        {(name) => (
          <symbol id={`di-icon-${name}`} viewBox="0 0 24 24" fill="none">
            <For each={ICONS[name]}>
              {(d) => (
                <path d={d} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              )}
            </For>
          </symbol>
        )}
      </For>
    </svg>
  )
}
