<script lang="ts">
  // Semantics only: a <form> that suppresses the native validation UI and
  // exposes a clean submit callback.
  import type { Snippet } from "svelte"

  type Props = { onsubmit?: () => void; children?: Snippet }

  let { onsubmit, children }: Props = $props()

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    onsubmit?.()
  }
</script>

<form novalidate onsubmit={handleSubmit}>
  {@render children?.()}
</form>
