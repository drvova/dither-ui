<script lang="ts" module>
  /** A row's `default` is the value as code; "" when the prop has none
   * (shown as "none", never a dash). */
  export type PropRow = { prop: string; type: string; default: string }
</script>

<script lang="ts">
  // The API as a spec sheet (the Vue docs' PropsTable): a flat shell under
  // spec-label column heads; on a phone, where three columns cannot fit,
  // each prop stacks over its type and default.
  type Props = { rows: PropRow[] }
  let { rows }: Props = $props()
</script>

<div class="flat-shell mt-6 hidden overflow-x-auto sm:block">
  <table class="w-full table-fixed border-collapse text-left text-[11px]">
    <thead>
      <tr class="border-b border-border text-muted-foreground">
        <th class="spec w-[24%] px-4 py-2.5">Prop</th>
        <th class="spec px-4 py-2.5">Type</th>
        <th class="spec w-[20%] px-4 py-2.5">Default</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.prop)}
        <tr class="border-b border-border last:border-0">
          <td class="px-4 py-2.5 align-top break-words text-foreground">{r.prop}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{r.type}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{r.default || "none"}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<dl class="flat-shell mt-6 overflow-hidden text-[12px] sm:hidden">
  {#each rows as r (r.prop)}
    <div class="border-b border-border px-4 py-3 last:border-0">
      <dt class="break-words text-foreground">{r.prop}</dt>
      <dd class="mt-1.5 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-muted-foreground">
        <span class="spec">Type</span><span class="break-words">{r.type}</span>
        <span class="spec">Default</span><span class="break-words">{r.default || "none"}</span>
      </dd>
    </div>
  {/each}
</dl>
