import { createMemo, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

type PluralSlot = (scope: { count: number }) => JSX.Element

/** Intl.PluralRules as a slot switch: the category (one/few/many/other…)
 * picks the slot, the default slot is the fallback, and every slot receives
 * `count` so the sentence can place it. Languages with richer plural
 * categories just get more named slots — no conditionals in the caller. */
export type PluralTextProps = { count?: number; locale?: string; class?: string; children?: PluralSlot } & Partial<
  Record<Intl.LDMLPluralRule, PluralSlot>
>

export default function PluralText(raw: PluralTextProps) {
  const props = mergeProps({ count: 0, locale: "en" }, raw)

  const category = createMemo(() => new Intl.PluralRules(props.locale).select(props.count))

  return <span class={cn(props.class)}>{(props[category()] ?? props.children)?.({ count: props.count })}</span>
}
