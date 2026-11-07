<script lang="ts">
  // The brand as cells (`brand.ts`): the lockup, 4px cells seven tall, set
  // where its parent places it, its field the nearest positioned ancestor.
  // Decorative.
  //
  // Its one moment, once, as it comes into view, in the move its scene names
  // (gather, rain, converge, strike). Each cell steps whole cells on the
  // grid. Home under five seconds, so it needs no pause; under reduced motion
  // (and without IntersectionObserver or `animate`) the brand is simply
  // there. With `replay`, a mouse or pen coming to rest on it plays the
  // moment again from the top, once it is home (a touch does not: a finger
  // passing over is not a hover). `onmoving` says the moment began (the
  // first time or again) and `onsettled` when it is home (at once when it
  // does not move), so a parent can keep one moving layer at a time.
  import { onDestroy, onMount } from "svelte"
  import { choreograph, LOCKUP, LOCKUP_SIZE, MOMENT, type Staging, type Waypoint } from "./brand"

  type Props = {
    scene: Staging
    replay?: boolean
    class?: string
    style?: string
    onmoving?: () => void
    onsettled?: () => void
  }
  let { scene, replay = false, class: className, style, onmoving, onsettled }: Props = $props()

  const CELL = 4
  const REDUCED = "(prefers-reduced-motion: reduce)"
  let lockup = $state<HTMLElement | null>(null)
  // Indexed by the lockup's order: kept by an action, not `bind:this`, as a
  // plain array nothing renders from (binding into it warned on every cell).
  const cells: HTMLElement[] = []
  const keep = (node: HTMLElement, i: number) => {
    cells[i] = node
  }
  let io: IntersectionObserver | null = null
  let near: IntersectionObserver | null = null
  // The moment's animations, two per cell; none where it does not move.
  let moves: Animation[] = []
  const home = () =>
    void moves[0]?.finished.then(
      () => onsettled?.(),
      () => {}
    )
  const play = () => {
    io?.disconnect()
    io = null
    onmoving?.()
    for (const move of moves) move.play()
  }

  function again(e: PointerEvent) {
    if (!replay || e.pointerType === "touch" || !moves.length) return
    // Only once home: not over a moment still playing, nor one still held for
    // its first view; and the reader may have asked for less motion since.
    if (moves.some((m) => m.playState !== "finished") || matchMedia(REDUCED).matches) return
    for (const move of moves) move.currentTime = 0
    play()
    home()
  }

  /** One axis of a path as keyframes, each leg stepped one cell at a time. */
  const legs = (path: Waypoint[], axis: "x" | "y", origin: number, value: (d: number) => Keyframe): Keyframe[] =>
    path.map((p, k) => {
      const next = path[k + 1]
      const steps = next ? Math.round(Math.abs(next[axis] - p[axis]) / CELL) : 0
      return { ...value(p[axis] - origin), offset: p.t / MOMENT.end, easing: `steps(${Math.max(1, steps)}, end)` }
    })

  /** Build the moment (each cell's path and its two stepped animations), held
   * loose until the lockup's home is in view, clear of the bottom edge. */
  function build(set: HTMLElement, field: HTMLElement) {
    const slots = LOCKUP.map((c) => ({ x: set.offsetLeft + c.x * CELL, y: set.offsetTop + c.y * CELL }))
    const box = { width: field.clientWidth, height: field.clientHeight }
    const paths = choreograph(scene(box.height, set.offsetTop), box, slots, CELL)
    // Each axis its own animation, so each steps whole cells.
    moves = cells.flatMap((el, i) => [
      el.animate(
        legs(paths[i], "x", slots[i].x, (d) => ({ translate: `${d}px 0` })),
        MOMENT.end,
      ),
      el.animate(
        legs(paths[i], "y", slots[i].y, (d) => ({ transform: `translateY(${d}px)` })),
        MOMENT.end,
      ),
    ])
    for (const move of moves) move.pause()
    home()
    io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play()
      },
      { threshold: 1, rootMargin: "0px 0px -10% 0px" },
    )
    io.observe(set)
  }

  onMount(() => {
    const set = lockup
    const field = set?.offsetParent
    if (
      !set ||
      !(field instanceof HTMLElement) ||
      !cells[0] ||
      typeof IntersectionObserver === "undefined" ||
      typeof cells[0].animate !== "function" ||
      matchMedia(REDUCED).matches
    )
      return onsettled?.()
    // The moment is built as the lockup comes within a screen of view, not
    // at mount: a brand far down the page (a plate, the footer) costs the
    // page's first load nothing (measured: building all four at mount was
    // a sixth of the landing's script at 4x CPU). Out there, unbuilt, its
    // cells stand home; nobody sees them until they are loose.
    near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        near?.disconnect()
        near = null
        build(set, field)
      },
      { rootMargin: "100% 0px" },
    )
    near.observe(set)
  })
  onDestroy(() => {
    io?.disconnect()
    near?.disconnect()
  })
</script>

<div
  bind:this={lockup}
  class={["brand-gather", className]}
  style:width="{LOCKUP_SIZE.width * CELL}px"
  style:height="{LOCKUP_SIZE.height * CELL}px"
  {style}
  aria-hidden="true"
  onpointerenter={again}
>
  {#each LOCKUP as c, i (`${c.x}.${c.y}`)}
    <span
      use:keep={i}
      class={["brand-cell", c.core && "core"]}
      style:left="{c.x * CELL}px"
      style:top="{c.y * CELL}px"
    ></span>
  {/each}
</div>

<style>
  .brand-gather {
    flex: none;
  }

  .brand-cell {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--ink);
  }

  .brand-cell.core {
    background: var(--signal);
  }
</style>
