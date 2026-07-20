<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    text?: string
    cols?: number
    class?: string
  }

  let { text = "DITHER", cols = 64, class: className }: Props = $props()

  const RAMP = " .:-=+*#%@"
  let art = $state("")

  // Rasterise the word to an offscreen canvas, then map coverage to an ASCII
  // ramp — a static, on-brand ASCII render. Client-only (canvas), SSR-safe.
  function build() {
    const cvs = document.createElement("canvas")
    const ctx = cvs.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    const c = Math.max(8, Math.min(200, Math.round(cols)))
    const fontPx = 80
    const font = `bold ${fontPx}px ui-monospace, "SFMono-Regular", monospace`
    ctx.font = font
    const w = Math.max(1, Math.ceil(ctx.measureText(text).width))
    const h = Math.ceil(fontPx * 1.25)
    cvs.width = w
    cvs.height = h
    ctx.font = font
    ctx.textBaseline = "middle"
    ctx.fillStyle = "#fff"
    ctx.clearRect(0, 0, w, h)
    ctx.fillText(text, 0, h / 2)
    const cellW = w / c
    const rows = Math.max(3, Math.round(h / (cellW * 1.9)))
    const cellH = h / rows
    const data = ctx.getImageData(0, 0, w, h).data
    let out = ""
    for (let ry = 0; ry < rows; ry++) {
      let line = ""
      for (let cx = 0; cx < c; cx++) {
        const px = Math.min(w - 1, Math.floor((cx + 0.5) * cellW))
        const py = Math.min(h - 1, Math.floor((ry + 0.5) * cellH))
        const a = data[(py * w + px) * 4 + 3] / 255
        line += RAMP[Math.min(RAMP.length - 1, Math.floor(a * RAMP.length))]
      }
      out += `${line}\n`
    }
    art = out
  }

  // onMounted(build) + watch([text, cols], build) as a single action: build on
  // mount, rebuild when the keyed param changes. No `$effect` (project rule).
  function render(_node: HTMLElement, _key: string) {
    build()
    return {
      update() {
        build()
      },
    }
  }
</script>

<pre
  use:render={`${text}|${cols}`}
  class={cn("dither-ascii font-mono leading-[0.85] text-[7px]", className)}
  aria-label={text}>{art}</pre>

<style>
  .dither-ascii {
    white-space: pre;
    letter-spacing: 0.5px;
  }
</style>
