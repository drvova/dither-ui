<script lang="ts">
  // The command box: its top row the step picker (segmented aria-pressed
  // toggles: the folder, then npm, pnpm and Bun under their own marks) and
  // the copy key, the command under them (the ember prompt, one line). A copy
  // is one gesture in CSS: the command shows selected while the key rolls to
  // "Copied"; both let go together when the copy settles. A status region
  // says it to screen readers.
  import { copier } from "../copy.svelte"
  import { commandPieces } from "./command"
  import { RUNTIME_DEPS } from "./facts"
  import ToolMark from "./ToolMark.svelte"

  const STEPS = [
    { id: "folder", label: "folder", cmd: "npx degit drvova/dither-ui/dither-kit-svelte src/dither-kit-svelte" },
    { id: "npm", label: "npm", cmd: `npm i ${RUNTIME_DEPS.join(" ")}` },
    { id: "pnpm", label: "pnpm", cmd: `pnpm add ${RUNTIME_DEPS.join(" ")}` },
    { id: "bun", label: "bun", cmd: `bun add ${RUNTIME_DEPS.join(" ")}` },
  ] as const

  let active = $state(0)
  const clip = copier()
  // Another step's command is not on the clipboard: its key starts fresh.
  function pick(i: number) {
    if (i === active) return
    clip.reset()
    active = i
  }
</script>

<div class="box">
  <div class="box-top">
    <div role="group" aria-label="Install steps" class="seg">
      {#each STEPS as s, i (s.id)}
        <button type="button" aria-pressed={active === i} onclick={() => pick(i)}>
          {#if s.id !== "folder"}<ToolMark id={s.id} size={12} />{/if}
          {s.label}
        </button>
      {/each}
    </div>
    <button
      type="button"
      class="copy"
      data-copied={clip.copied ? "true" : "false"}
      aria-label="Copy command"
      onclick={() => clip.copy(STEPS[active].cmd)}
    >
      <span class="roll" aria-hidden="true"><span><span>Copy</span><span>Copied</span></span></span>
    </button>
    <span class="sr-only" role="status">{clip.copied ? "Copied" : ""}</span>
  </div>
  <div class="frame">
    <code class="cmd">
      <span class="prompt" aria-hidden="true">$</span>{#key active}<span class="typed"
          >{#each commandPieces(STEPS[active].cmd) as w, i (i)}{i ? " " : ""}{#each w as p, j (j)}{#if j}<wbr
                />{/if}<span class="word">{p}</span>{/each}{/each}</span
        >{/key}<span class="caret" aria-hidden="true">▌</span>
    </code>
  </div>
</div>

<style>
  /* The box: the raised ground, no border; the picker and the copy key on
     its top row (their filled shapes take the page's ground), the command
     under them. */
  .box {
    overflow: hidden;
    border-radius: 16px;
    background: var(--surface);
  }

  .box-top {
    --surface: var(--background);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 10px 0 12px;
  }

  .frame {
    display: flex;
    align-items: center;
    min-width: 0;
    height: 56px;
    padding: 0 18px;
  }

  .cmd {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--ink-3);
    white-space: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .cmd::-webkit-scrollbar {
    display: none;
  }

  /* A piece of the command never breaks (a hyphen is no place to wrap); a
     path may wrap after its slashes (`command.ts`). */
  .word {
    white-space: nowrap;
  }

  .prompt {
    color: var(--signal);
    margin-right: 10px;
  }

  .typed {
    border-radius: 2px;
    color: var(--ink);
    animation: term-in 240ms var(--ease-settle) both;
    transition:
      background-color 360ms steps(3, jump-end),
      box-shadow 360ms steps(3, jump-end);
  }

  @keyframes term-in {
    0% {
      opacity: 0;
      transform: translateX(-4px);
    }
  }

  /* Copied: the command shows selected, the page's ground behind the text
     the clipboard now holds. It lands at once and steps out in three when
     the copy settles. */
  .box:has(.copy[data-copied="true"]) .typed {
    background-color: var(--background);
    box-shadow: 0 0 0 4px var(--background);
    transition-duration: 0s;
  }

  .caret {
    margin-left: 4px;
    font-size: 11px;
    color: var(--signal);
    animation: blink 1.1s steps(2, jump-none) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  /* Copy: a filled key. */
  .copy {
    display: inline-flex;
    align-items: center;
    flex: none;
    height: 30px;
    padding: 0 12px;
    border-radius: 7px;
    font-size: 11.5px;
    color: var(--ink-3);
    background: var(--surface);
    cursor: pointer;
    transition:
      color 150ms var(--ease-settle),
      transform 350ms var(--ease-settle);
  }

  .copy:hover,
  .copy[data-copied="true"] {
    color: var(--ink);
  }

  .copy:active {
    transform: scale(0.96);
  }

  /* Label roll: both words stacked in a one-line window; a copy slides the
     column up. The window keeps the key's width at the longer word. */
  .roll {
    display: block;
    height: 1.3em;
    line-height: 1.3em;
    overflow: hidden;
  }

  .roll > span {
    display: block;
    transition: transform 380ms var(--ease-settle);
  }

  .roll > span > span {
    display: block;
  }

  .copy[data-copied="true"] .roll > span {
    transform: translateY(-1.3em);
  }

  /* On a phone the picker takes the top row alone, and the command wraps
     beside the copy key under it, so the whole command shows. */
  @media (max-width: 639px) {
    .box {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
    .box-top {
      display: contents;
    }
    .seg {
      grid-column: 1 / -1;
      margin: 10px 10px 0 12px;
    }
    .frame {
      grid-area: 2 / 1;
      height: auto;
      min-height: 56px;
      padding: 12px 12px 12px 18px;
    }
    /* Wrapped: the prompt, the words and the caret flow as one line of
       text, the caret after the last word. */
    .cmd {
      display: block;
      white-space: normal;
      line-height: 1.6;
    }
    .copy {
      grid-area: 2 / 2;
      margin-right: 10px;
    }
  }

  @media (forced-colors: active) {
    .copy {
      border: 1px solid ButtonText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .roll > span,
    .typed {
      transition: none;
    }
    .caret,
    .typed {
      animation: none;
    }
  }
</style>
