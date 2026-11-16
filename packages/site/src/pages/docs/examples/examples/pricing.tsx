import { For, Show } from "solid-js"
import { DitherButton, DitherGradient, type ButtonVariant, type DitherColor } from "@dither-kit"

const TIERS: {
  name: string
  price: string
  blurb: string
  popular: boolean
  features: string[]
  cta: { label: string; variant: ButtonVariant; color: DitherColor }
}[] = [
  {
    name: "Free",
    price: "$0",
    blurb: "for side projects",
    popular: false,
    features: ["1 workspace", "10k renders / mo", "Community support"],
    cta: { label: "Start free", variant: "dotted", color: "grey" },
  },
  {
    name: "Pro",
    price: "$12",
    blurb: "for products",
    popular: true,
    features: ["Unlimited workspaces", "10M renders / mo", "All chart types", "Email support"],
    cta: { label: "Go Pro", variant: "gradient", color: "blue" },
  },
  {
    name: "Scale",
    price: "$49",
    blurb: "for teams",
    popular: false,
    features: ["Everything in Pro", "SSO + audit log", "Priority support", "Custom palettes"],
    cta: { label: "Contact us", variant: "solid", color: "purple" },
  },
]

export default function Example() {
  return (
    <div class="grid gap-4 text-left sm:grid-cols-3">
      <For each={TIERS}>
        {(tier) => (
          <div class="relative isolate flex flex-col overflow-hidden rounded-lg border border-border/60 p-4">
            <Show when={tier.popular}>
              <DitherGradient class="-z-10" from="blue" opacity={0.12} cell={4} renderMode="static" />
            </Show>
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground">{tier.name}</span>
              <Show when={tier.popular}>
                <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  popular
                </span>
              </Show>
            </div>
            <div class="mt-2 text-lg tracking-tight tabular-nums">
              {tier.price}
              <span class="text-[11px] text-muted-foreground">/mo</span>
            </div>
            <div class="text-[10px] text-muted-foreground">{tier.blurb}</div>
            <ul class="mt-4 grid gap-1.5">
              <For each={tier.features}>
                {(f) => (
                  <li class="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span class="size-1.5 shrink-0 bg-foreground/40" /> {f}
                  </li>
                )}
              </For>
            </ul>
            <DitherButton class="mt-4 w-full py-2 text-[11px]" variant={tier.cta.variant} color={tier.cta.color}>
              {tier.cta.label}
            </DitherButton>
          </div>
        )}
      </For>
    </div>
  )
}
