import { For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"

export type Crumb = { label: string; href?: string }

export type DitherBreadcrumbProps = {
  items: Crumb[]
  separator?: string
  class?: string
}

export default function DitherBreadcrumb(raw: DitherBreadcrumbProps) {
  const props = mergeProps({ separator: "/" }, raw)
  return (
    <nav aria-label="Breadcrumb" class={cn("text-[13px]", props.class)}>
      <ol class="flex flex-wrap items-center gap-1.5">
        <For each={props.items}>
          {(c, i) => (
            <li class="flex items-center gap-1.5">
              <Show
                when={c.href && i() < props.items.length - 1}
                fallback={
                  <span
                    aria-current={i() === props.items.length - 1 ? "page" : undefined}
                    class={i() === props.items.length - 1 ? "text-foreground" : "text-muted-foreground"}
                  >
                    {c.label}
                  </span>
                }
              >
                <a
                  href={c.href}
                  class="-my-0.5 rounded-sm py-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
                >
                  {c.label}
                </a>
              </Show>
              <Show when={i() < props.items.length - 1}>
                <span aria-hidden="true" class="select-none text-muted-foreground/40">
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
