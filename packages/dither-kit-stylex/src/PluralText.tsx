// Generated from dither-kit/solid/PluralText.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"

type PluralSlot = (scope: { count: number }) => JSX.Element

/** Intl.PluralRules as a slot switch: the category (one/few/many/other…)
 * picks the slot, the default slot is the fallback, and every slot receives
 * `count` so the sentence can place it. Languages with richer plural
 * categories just get more named slots — no conditionals in the caller. */
export type PluralTextProps = {
  count?: number
  locale?: string
  class?: string
  xstyle?: StyleProp
  children?: PluralSlot
} & Partial<Record<Intl.LDMLPluralRule, PluralSlot>>

export default function PluralText(raw: PluralTextProps) {
  const props = mergeProps({ count: 0, locale: "en" }, raw)

  const category = createMemo(() => new Intl.PluralRules(props.locale).select(props.count))

  return (
    <span class={cn(props.xstyle, props.class)}>{(props[category()] ?? props.children)?.({ count: props.count })}</span>
  )
}
