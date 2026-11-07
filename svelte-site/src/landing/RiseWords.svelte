<script lang="ts">
  // A headline's words for the rise (`use:rise`): each its own box, so each
  // can travel, with the spaces between them left as text, so the line still
  // breaks and reads as one. `word` is a class every word wears (the hero's
  // chrome ramp sits on each word, one horizon per line).
  let { text, word = "" }: { text: string; word?: string } = $props()
  const words = $derived(text.split(" "))
</script>

{#each words as w, i (i)}<span data-rise="word" class="rise-word {word}">{w}</span
  >{#if i < words.length - 1}{" "}{/if}{/each}

<style>
  .rise-word {
    display: inline-block;
  }
</style>
