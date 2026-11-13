// Generated from ../solid/DitherBreadcrumb.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  ol: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" },
  li: { display: "flex", alignItems: "center", gap: "0.375rem" },
  a: {
    marginBlock: "-0.125rem",
    borderRadius: "calc(var(--radius) - 2px)",
    paddingBlock: "0.125rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
      ":focus-visible": "var(--foreground)",
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text: {
    color: "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  nav: { fontSize: "13px" },
  text2: { color: "var(--foreground)" },
  text3: { color: "var(--muted-foreground)" },
})

export type Crumb = { label: string; href?: string }

export type DitherBreadcrumbProps = {
  items: Crumb[]
  separator?: string
  class?: string
  xstyle?: StyleProp
}

export default function DitherBreadcrumb(raw: DitherBreadcrumbProps) {
  const props = mergeProps({ separator: "/" }, raw)
  return (
    <nav aria-label="Breadcrumb" class={cn(styles.nav, props.xstyle, props.class)}>
      <ol {...stylex.props(styles.ol)}>
        <For each={props.items}>
          {(c, i) => (
            <li {...stylex.props(styles.li)}>
              <Show
                when={c.href && i() < props.items.length - 1}
                fallback={
                  <span
                    aria-current={i() === props.items.length - 1 ? "page" : undefined}
                    class={cn(i() === props.items.length - 1 ? styles.text2 : styles.text3)}
                  >
                    {c.label}
                  </span>
                }
              >
                <a href={c.href} {...stylex.props(styles.a)}>
                  {c.label}
                </a>
              </Show>
              <Show when={i() < props.items.length - 1}>
                <span aria-hidden="true" {...stylex.props(styles.text)}>
                  {props.separator}
                </span>
              </Show>
            </li>
          )}
        </For>
      </ol>
    </nav>
  )
}
