import { For, Show } from "solid-js"
import {
  cssColor,
  DitherAvatar,
  DitherButton,
  DitherGradient,
  type ButtonVariant,
  type DitherColor,
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { dataCode } from "../snippet"

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

const FEED = [
  { name: "ada", text: "pushed to dither-engine", time: "2m", unread: true },
  { name: "grace", text: "opened #128 dithered tooltips", time: "14m", unread: true },
  { name: "linus", text: "released v0.2.0", time: "1h", unread: false },
  { name: "barbara", text: "commented on #124", time: "3h", unread: false },
  { name: "alan", text: "merged #122 radar sparkles", time: "5h", unread: false },
]

const RELEASES = [
  { version: "v0.3.0", title: "Interactive docs playgrounds", date: "today", tags: ["docs", "charts"] },
  { version: "v0.2.0", title: "Motion, bloom and replay", date: "last week", tags: [] },
  { version: "v0.1.0", title: "First public dither", date: "Jan", tags: [] },
]

const SNIPPET_PRICING = `${dataCode("tiers", TIERS)}

<div class="grid gap-4 sm:grid-cols-3">
  <For each={tiers}>
    {(tier) => (
      <div class="relative isolate flex flex-col overflow-hidden rounded-lg border p-4">
        <Show when={tier.popular}><DitherGradient from="blue" opacity={0.12} class="-z-10" /></Show>
        <span class="text-[11px] text-muted-foreground">{tier.name}</span>
        <b class="mt-2 text-lg tabular-nums">{tier.price}<span class="text-[11px]">/mo</span></b>
        <span class="text-[10px] text-muted-foreground">{tier.blurb}</span>
        <ul class="mt-4 grid gap-1.5">
          <For each={tier.features}>
            {(f) => (
              <li class="flex items-center gap-2 text-[11px]">
                <span class="size-1.5 bg-foreground/40" /> {f}
              </li>
            )}
          </For>
        </ul>
        <DitherButton variant={tier.cta.variant} color={tier.cta.color} class="mt-4 w-full">
          {tier.cta.label}
        </DitherButton>
      </div>
    )}
  </For>
</div>`

const SNIPPET_ACTIVITY = `${dataCode("feed", FEED)}

<div class="rounded-lg border">
  <header class="px-4 py-2.5 text-[11px] text-muted-foreground">dither-ui activity</header>
  <For each={feed}>
    {(row) => (
      <div class="flex items-center gap-3 border-t px-4 py-2.5 text-[11px]">
        <DitherAvatar name={row.name} size={24} animate={false} />
        <span class="flex-1"><b>{row.name}</b> {row.text}</span>
        <Show when={row.unread}>
          <span
            class="size-1.5 rounded-full"
            style={{ "background-color": cssColor('blue') }}
          />
        </Show>
        <time class="tabular-nums">{row.time}</time>
      </div>
    )}
  </For>
</div>`

const SNIPPET_CHANGELOG = `${dataCode("releases", RELEASES)}

<For each={releases}>
  {(r, i) => (
    <div class="flex gap-3">
      <div class="flex flex-col items-center">
        <span
          class="mt-1 size-2 rounded-[2px] bg-border"
          style={i() === 0 ? { "background-color": cssColor('green') } : {}}
        />
        <Show when={i() < releases.length - 1}><span class="w-px flex-1 bg-border/60" /></Show>
      </div>
      <div class="pb-6">
        <b class="text-[11px]">{r.version}</b> <time class="text-[10px]">{r.date}</time>
        <p class="text-[13px]">{r.title}</p>
        <For each={r.tags}>{(tag) => <span class="mr-1.5 rounded border px-1.5 text-[10px]">{tag}</span>}</For>
      </div>
    </div>
  )}
</For>`

export default function ProductExamples() {
  return (
    <>
      {/* Pricing */}
      <section class="mt-16 scroll-mt-24" id="pricing">
        <h2 class="text-lg tracking-tight">Pricing</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Three tiers from tokens and kit primitives. The popular plan gets a dither wash, and nothing else shouts.
        </p>
        <DemoCard code={SNIPPET_PRICING}>
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
        </DemoCard>
      </section>
      {/* Activity feed */}
      <section class="mt-16 scroll-mt-24" id="activity">
        <h2 class="text-lg tracking-tight">Activity feed</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A team feed: deterministic avatars, one accent dot per unread row, times right-aligned.
        </p>
        <DemoCard code={SNIPPET_ACTIVITY}>
          <div class="mx-auto max-w-md rounded-lg border border-border/60 text-left">
            <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <span class="text-[11px] text-muted-foreground">dither-ui activity</span>
              <span class="text-[11px] tabular-nums text-muted-foreground">today</span>
            </div>
            <For each={FEED}>
              {(row, i) => (
                <div class={`flex items-center gap-3 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
                  <DitherAvatar name={row.name} size={24} animate={false} />
                  <span class="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                    <span class="text-foreground/90">{row.name}</span> {row.text}
                  </span>
                  <Show when={row.unread}>
                    <span class="size-1.5 shrink-0 rounded-full" style={{ "background-color": cssColor("blue") }} />
                  </Show>
                  <span class="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{row.time}</span>
                </div>
              )}
            </For>
          </div>
        </DemoCard>
      </section>
      {/* Changelog */}
      <section class="mt-16 scroll-mt-24" id="changelog">
        <h2 class="text-lg tracking-tight">Changelog</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A release timeline: square markers on a thin rail, the newest release seeded green.
        </p>
        <DemoCard code={SNIPPET_CHANGELOG}>
          <div class="mx-auto max-w-md text-left">
            <For each={RELEASES}>
              {(r, i) => (
                <div class="flex gap-3">
                  <div class="flex flex-col items-center">
                    <span
                      class={`mt-1 size-2 shrink-0 rounded-[2px] ${i() === 0 ? "" : "bg-border"}`}
                      style={i() === 0 ? { "background-color": cssColor("green") } : {}}
                    />
                    <Show when={i() < RELEASES.length - 1}>
                      <span class="w-px flex-1 bg-border/60" />
                    </Show>
                  </div>
                  <div class={i() < RELEASES.length - 1 ? "pb-6" : ""}>
                    <div class="flex items-baseline gap-2">
                      <span class="text-[11px] text-foreground/90">{r.version}</span>
                      <span class="text-[10px] text-muted-foreground">{r.date}</span>
                    </div>
                    <div class="mt-0.5 text-[13px] tracking-tight">{r.title}</div>
                    <Show when={r.tags.length}>
                      <div class="mt-2 flex gap-1.5">
                        <For each={r.tags}>
                          {(tag) => (
                            <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {tag}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </DemoCard>
      </section>
    </>
  )
}
