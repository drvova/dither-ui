<script lang="ts" module>
  export type PropRow = { prop: string; type: string; default: string }
</script>

<script lang="ts">
  type Props = { rows: PropRow[] }
  let { rows }: Props = $props()
</script>

<div class="mt-6 overflow-x-auto rounded-lg border border-border/60">
  <table class="w-full table-fixed border-collapse text-left text-[11px]">
    <thead>
      <tr class="border-b border-border/60 text-muted-foreground">
        <th class="w-1/3 px-4 py-2.5 font-medium">Prop</th>
        <th class="px-4 py-2.5 font-medium">Type</th>
        <th class="w-1/4 px-4 py-2.5 font-medium">Default</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as r (r.prop)}
        <tr class="border-b border-border/40 last:border-0">
          <td class="px-4 py-2.5 align-top break-words text-foreground/90">{r.prop}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{r.type}</td>
          <td class="px-4 py-2.5 align-top break-words text-muted-foreground">{r.default}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
