// The brand mark: the 7x7 dithered diamond, ember core, `size` px square,
// the sprite's (`sprite.ts`); given `cells`, another mark on the same grid
// in the same hand (the close mark), its inks drawn as a path each.
// Decorative: its link or its place names it.
import { For, type JSX, Show, splitProps } from "solid-js"
import { runPaths } from "@/shared/ui/cells"
import { BRAND_SYMBOL, spriteRef } from "@/shared/ui/sprite"

type Own = { size: number; cells?: readonly { x: number; y: number; core?: boolean }[] }
type BrandMarkProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

const EMBER = "var(--signal, var(--swatch-orange))"

export default function BrandMark(raw: BrandMarkProps) {
  const [props, rest] = splitProps(raw, ["size", "cells"])
  return (
    <svg
      {...rest}
      viewBox="0 0 7 7"
      width={props.size}
      height={props.size}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
    >
      <Show when={props.cells} fallback={<use href={spriteRef(BRAND_SYMBOL)} />}>
        {(cells) => (
          <For each={runPaths(cells(), (c) => (c.core ? "core" : "ink"))}>
            {(p) => <path d={p.d} fill={p.paint === "core" ? EMBER : "currentColor"} />}
          </For>
        )}
      </Show>
    </svg>
  )
}
