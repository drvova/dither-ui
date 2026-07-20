<script lang="ts" module>
  export type Crumb = { label: string; href?: string }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    items: Crumb[]
    separator?: string
    class?: string
  }

  let { items, separator = "/", class: className }: Props = $props()
</script>

<nav aria-label="Breadcrumb" class={cn("text-[13px]", className)}>
  <ol class="flex flex-wrap items-center gap-1.5">
    {#each items as c, i (i)}
      <li class="flex items-center gap-1.5">
        {#if c.href && i < items.length - 1}
          <a
            href={c.href}
            class="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
            >{c.label}</a
          >
        {:else}
          <span
            aria-current={i === items.length - 1 ? "page" : undefined}
            class={i === items.length - 1 ? "text-foreground" : "text-muted-foreground"}
            >{c.label}</span
          >
        {/if}
        {#if i < items.length - 1}
          <span aria-hidden="true" class="select-none text-muted-foreground/40">{separator}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
