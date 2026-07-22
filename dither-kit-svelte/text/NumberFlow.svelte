<script lang="ts">
  import { cn } from "../runtime/lib"

  /** Odometer for live values — each digit rides a 0-9 column that rolls to the
   * new figure whenever `value` changes. Separators stay put. Reduced motion
   * snaps columns without the roll. */
  type Props = {
    value: number
    decimals?: number
    /** Roll time per change, ms. */
    duration?: number
    class?: string
  }

  let { value, decimals = 0, duration = 600, class: className }: Props = $props()

  const chars = $derived(
    value
      .toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      .split("")
  )
  const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
</script>

<span class={cn("inline-flex tabular-nums", className)} aria-live="polite">
  <span class="sr-only">{chars.join("")}</span>
  {#each chars as c, i (`${chars.length}-${i}`)}
    {#if /\d/.test(c)}
      <span aria-hidden="true" class="inline-block h-[1em] overflow-hidden">
        <span
          class="grid transition-transform ease-out motion-reduce:transition-none"
          style:transform={`translateY(-${Number(c)}em)`}
          style:transition-duration={`${duration}ms`}
        >
          {#each DIGITS as d (d)}
            <span class="h-[1em] leading-none">{d}</span>
          {/each}
        </span>
      </span>
    {:else}
      <span aria-hidden="true" class="leading-none">{c}</span>
    {/if}
  {/each}
</span>
