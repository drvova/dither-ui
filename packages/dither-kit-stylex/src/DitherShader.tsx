// Generated from @dither-ui/kit/solid/DitherShader.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { directedTime, isDirected } from "@dither-ui/kit/engine/clock.ts"
import {
  type ChannelInput,
  type Channels,
  createChannels,
  createGl,
  dropProgram,
  finishProgram,
  type GlHandle,
  type PendingProgram,
  programReady,
  startProgram,
} from "@dither-ui/kit/engine/gl.ts"
import { clamp01, fillOf, type PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import type { DitherRenderMode } from "@dither-ui/kit/engine/precompile.ts"
import type { RasterBuffer } from "@dither-ui/kit/engine/raster.ts"
import {
  ditherShaderPixels,
  sampleShader,
  SHADER_UNIFORMS,
  wrapShader,
  type ShaderDither,
  type ShaderProgram,
} from "@dither-ui/kit/engine/shader.ts"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "@dither-ui/kit/solid/runtime/screen.ts"
import { createDitherBackground, type DitherSurface } from "@dither-ui/kit/solid/runtime/surface.ts"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  p: {
    position: "absolute",
    insetInline: "0px",
    bottom: "0.5rem",
    paddingInline: "0.5rem",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    overflowWrap: "break-word",
    color: "var(--muted-foreground)",
  },
  frame: { position: "relative", display: "block", height: "100%", width: "100%", overflow: "hidden" },
})

export type { ShaderDither, ShaderProgram }
export { ditherShaderPixels, sampleShader, wrapShader }

/** What `iChannelN` may be bound to: a kit surface (a component instance,
 * its exposed surface, or its canvas), or any canvas, image or video. */
export type ShaderChannel = ChannelInput

/** What the shader hands its `ref`: its surface, for another surface to read. */
export type DitherShaderApi = { surface: DitherSurface }

export type DitherShaderProps = {
  /** URL of a .frag / .glsl file.
   * @docs string: URL of a .frag / .glsl file
   * @default undefined */
  src?: string
  /** Inline GLSL: Shadertoy `mainImage` or a raw `main`; wins over `src`.
   * @docs string: inline GLSL (Shadertoy mainImage or a raw main); wins over src
   * @default undefined */
  source?: string
  /** Up to four sources bound as `iChannel0..3`: other kit surfaces (pulled
   * at the same clock time), or any canvas, image or video.
   * @docs (surface | component | canvas | image | video)[]: bound as iChannel0..3; a kit surface is pulled at the same
   *   clock time, so the graph seeks and renders as one
   * @default undefined */
  channels?: ShaderChannel[]
  /** Tint of the mono mode, and `iColor` in the shader.
   * @docs PixelColor: the mono tint and iColor */
  color?: PixelColor
  /** A palette ramp, dark to light: luminance picks the band, the Bayer cell dithers between bands.
   * @docs PixelColor[]: a palette ramp; luminance picks the band, the Bayer cell dithers between bands
   * @default undefined */
  colors?: PixelColor[]
  /** Threshold luminance to 1 bit in `color` instead of keeping the shader's colours.
   * @docs boolean: 1-bit luminance in color instead of the shader's colours */
  mono?: boolean
  /** 0 smooth → 1 fully quantized.
   * @docs number: 0 smooth → 1 fully quantized */
  dither?: number
  /** Colour levels per channel (2 = the 8-colour look).
   * @docs number: colour levels per channel (2 = eight colours) */
  levels?: number
  /** Mono: alpha floor of the unlit cells, 0-1.
   * @docs number: in mono, the alpha floor of unlit cells */
  shade?: number
  /** Multiplies iTime.
   * @docs number: multiplies iTime */
  speed?: number
  /** Seeds the dither matrix, `iSeed`, and without src/source the sample shader.
   * @docs number: dither matrix + the sample shader
   * @default undefined */
  seed?: number
  /** Backing cell size in CSS px: bigger is chunkier.
   * @docs number: backing cell in CSS px; the shader runs at this resolution */
  cell?: number
  /** Feed the pointer to iMouse.
   * @docs boolean: the pointer feeds iMouse */
  interactive?: boolean
  /** Accessible name.
   * @docs string: accessible name */
  label?: string
  dpr?: number
  /** Stop-motion cadence in fps (0 = smooth; see timing.ts).
   * @docs number: stop-motion cadence in fps (0 = smooth) */
  frameRate?: number
  paused?: boolean
  renderMode?: DitherRenderMode
  class?: string
  xstyle?: StyleProp
  ref?: (api: DitherShaderApi) => void
}

const MAX_COLS = 480
const MAX_ROWS = 320

type Status = "ready" | "loading" | "error" | "unsupported"

export default function DitherShader(raw: DitherShaderProps) {
  const props = mergeProps(
    {
      src: "",
      source: "",
      color: "blue" as PixelColor,
      mono: false,
      dither: 1,
      levels: 2,
      shade: 0,
      speed: 1,
      cell: 3,
      interactive: true,
      label: "Shader",
      paused: false,
      frameRate: 0,
      renderMode: "live" as DitherRenderMode,
    },
    raw,
  )

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const [code, setCode] = createSignal("")
  const [status, setStatus] = createSignal<Status>("ready")
  const [problem, setProblem] = createSignal("")
  const note = createMemo(() =>
    status() === "loading"
      ? "loading shader"
      : status() === "unsupported"
        ? "WebGL is not available"
        : status() === "error"
          ? problem()
          : "",
  )

  // ---- source -------------------------------------------------------------------

  let ctl: AbortController | null = null

  /** The source that needs no fetch (inline, or the sample); false when it
   * has to be fetched. */
  function inline(): boolean {
    if (props.source) {
      setCode(props.source)
      return true
    }
    if (!props.src) {
      setCode(sampleShader(props.seed ?? 0))
      return true
    }
    return false
  }

  function load() {
    ctl?.abort()
    ctl = null
    if (inline()) return
    if (typeof fetch !== "function") {
      setStatus("error")
      setProblem("could not load the shader")
      return
    }
    const c = new AbortController()
    ctl = c
    setStatus("loading")
    fetch(props.src, { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.text()
      })
      .then((text) => {
        if (c.signal.aborted) return
        setStatus("ready")
        setCode(text)
      })
      .catch(() => {
        if (c.signal.aborted) return
        setStatus("error")
        setProblem("could not load the shader")
        setCode("")
      })
  }

  // What is at hand is taken while rendering, so a server prints the same
  // state; a file is fetched once mounted.
  if (!inline()) setStatus("loading")
  onMount(() => {
    if (status() === "loading") load()
    createEffect(on(() => [props.source, props.src, props.seed], load, { defer: true }))
  })

  // ---- the GPU half ---------------------------------------------------------------

  let handle: GlHandle | null | undefined
  let program: WebGLProgram | null = null
  let pending: PendingProgram | null = null
  let compiled: string | null = null
  let locations: Partial<Record<(typeof SHADER_UNIFORMS)[number], WebGLUniformLocation | null>> = {}
  let channelSet: Channels | null = null
  let pixels = new Uint8Array(0)
  let generation = 0
  const mouse = { x: 0, y: 0, cx: 0, cy: 0, down: false }

  /** The handle while it draws, its objects made again after a restore
   * (a restored context holds none of what was made before). */
  function live(): GlHandle | null {
    if (handle === undefined) handle = createGl()
    if (!handle || handle.lost()) return null
    if (generation !== handle.generation()) {
      generation = handle.generation()
      program = null
      pending = null
      compiled = null
      locations = {}
      channelSet = null
    }
    return handle
  }

  /** Hand the program for `source` to the driver, collected by `settle`
   * once it is ready (so compiling never holds the page), or the error note. */
  function compile(h: GlHandle, source: string): void {
    const gl = h.gl
    if (program) gl.deleteProgram(program)
    if (pending) dropProgram(gl, pending)
    program = null
    pending = null
    locations = {}
    compiled = source
    const built = wrapShader(source, h.webgl2)
    if (built.version === 2 && !h.webgl2) {
      setStatus("error")
      setProblem("this shader needs WebGL2")
      return
    }
    const started = startProgram(gl, built.vertex, built.fragment, ["p"])
    if (typeof started === "string") {
      setStatus("error")
      setProblem(started)
      return
    }
    pending = started
  }

  /** Collect the started program; sets `program` or the error note. */
  function settle(h: GlHandle, started: PendingProgram): void {
    const gl = h.gl
    pending = null
    const p = finishProgram(gl, started)
    if (typeof p === "string") {
      setStatus("error")
      setProblem(p)
      return
    }
    program = p
    for (const name of SHADER_UNIFORMS) locations[name] = gl.getUniformLocation(p, name)
    setStatus("ready")
    setProblem("")
    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.useProgram(p)
    for (let i = 0; i < 4; i++) {
      const loc = locations[`iChannel${i}` as "iChannel0"]
      if (loc) gl.uniform1i(loc, i)
    }
  }

  const matrix = useDitherMatrix(() => props.seed)
  const dither = createMemo<ShaderDither>(() => ({
    matrix: matrix(),
    dither: clamp01(props.dither),
    levels: Math.max(2, Math.round(props.levels)),
    mono: props.mono ? fillOf(props.color) : null,
    shade: clamp01(props.shade),
    palette: props.colors && props.colors.length >= 2 ? props.colors.map(fillOf) : null,
  }))

  function draw(buffer: RasterBuffer, clock: number, dt: number) {
    const glh = live()
    if (!glh) {
      buffer.data.fill(0)
      if (status() === "ready") setStatus("unsupported")
      return
    }
    if (!code()) {
      buffer.data.fill(0)
      return
    }
    if (compiled !== code()) compile(glh, code())
    // Still compiling: a running shader holds its raster and asks again next
    // frame; a frame that must be exact (paused, directed) waits for it.
    if (pending) {
      if (!props.paused && !isDirected() && !programReady(glh.gl, pending)) return
      settle(glh, pending)
    }
    if (!program) {
      buffer.data.fill(0)
      return
    }
    const gl = glh.gl
    const w = buffer.width
    const h = buffer.height
    glh.size(w, h)
    gl.useProgram(program)
    const t = clock * props.speed
    const u = locations
    if (props.channels?.length) {
      channelSet = channelSet ?? createChannels(glh)
      const bound = channelSet.upload(props.channels, 0, t, directedTime())
      if (u.iChannelResolution) gl.uniform3fv(u.iChannelResolution, bound.res)
      if (u.iChannelTime) gl.uniform1fv(u.iChannelTime, bound.times)
    }
    const now = new Date()
    const [cr, cg, cb] = fillOf(props.color)
    if (u.iResolution) gl.uniform3f(u.iResolution, w, h, 1)
    if (u.iTime) gl.uniform1f(u.iTime, t)
    if (u.iTimeDelta) gl.uniform1f(u.iTimeDelta, dt)
    if (u.iFrame) gl.uniform1i(u.iFrame, Math.round(t * 60))
    if (u.iMouse)
      gl.uniform4f(u.iMouse, mouse.x * w, mouse.y * h, mouse.down ? mouse.cx * w : 0, mouse.down ? mouse.cy * h : 0)
    if (u.iDate) gl.uniform4f(u.iDate, now.getFullYear(), now.getMonth(), now.getDate(), t)
    if (u.iColor) gl.uniform3f(u.iColor, cr / 255, cg / 255, cb / 255)
    if (u.iSeed) gl.uniform1f(u.iSeed, props.seed ?? 0)
    if (u.resolution) gl.uniform2f(u.resolution, w, h)
    if (u.u_resolution) gl.uniform2f(u.u_resolution, w, h)
    if (u.time) gl.uniform1f(u.time, t)
    if (u.u_time) gl.uniform1f(u.u_time, t)
    if (u.mouse) gl.uniform2f(u.mouse, mouse.x, mouse.y)
    if (u.u_mouse) gl.uniform2f(u.u_mouse, mouse.x * w, mouse.y * h)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    // Running, it reads back without waiting on the GPU (a paint behind,
    // never a stall); one frame that must be exact, a paused surface's last
    // or a directed moment, reads at once. Nothing back yet: the raster
    // holds the last.
    if (props.paused || isDirected()) pixels = glh.read(pixels)
    else {
      const behind = glh.readBehind(pixels)
      if (!behind) return
      pixels = behind
    }
    ditherShaderPixels(pixels, buffer, dither())
  }

  function pointer(e: PointerEvent) {
    const box = wrap?.getBoundingClientRect()
    if (!box || !box.width || !box.height) return
    mouse.x = clamp01((e.clientX - box.left) / box.width)
    mouse.y = clamp01(1 - (e.clientY - box.top) / box.height)
  }

  function onDown(e: PointerEvent) {
    if (!props.interactive || e.button !== 0) return
    pointer(e)
    mouse.down = true
    mouse.cx = mouse.x
    mouse.cy = mouse.y
    wrap?.setPointerCapture?.(e.pointerId)
  }

  function onMove(e: PointerEvent) {
    if (props.interactive) pointer(e)
  }

  function onUp() {
    mouse.down = false
  }

  /** The GPU half's first cost, the context and the program, started ahead. */
  function warm() {
    const h = live()
    if (h && code() && compiled !== code()) compile(h, code())
  }

  // Warmed as the shader nears the screen, at idle: making the context and
  // compiling the program were most of its first frame, a stall just as it
  // came into view; now that frame only draws. Never for one far off, so a
  // page of shaders holds no contexts it never shows.
  let near: IntersectionObserver | null = null
  let idle = 0
  onMount(() => {
    onCleanup(() => {
      near?.disconnect()
      if (idle) {
        if (typeof cancelIdleCallback === "function") cancelIdleCallback(idle)
        else clearTimeout(idle)
      }
      ctl?.abort()
      // Losing the context frees all it holds (see `GlHandle.dispose`).
      handle?.dispose()
      handle = null
      program = null
      pending = null
      channelSet = null
    })
    const el = wrap
    if (!el || typeof IntersectionObserver === "undefined") return
    near = new IntersectionObserver(
      (entries) => {
        const entry = latestEntry(entries)
        if (!entry?.isIntersecting) return
        near?.disconnect()
        near = null
        idle =
          typeof requestIdleCallback === "function"
            ? requestIdleCallback(warm, { timeout: 1000 })
            : window.setTimeout(warm, 200)
      },
      { rootMargin: "100% 0px" },
    )
    near.observe(el)
  })

  const surface = createDitherBackground({
    wrap: () => wrap ?? null,
    canvas: () => canvas ?? null,
    cell: () => Math.max(1, props.cell),
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
    dpr: () => props.dpr,
    paused: () => props.paused,
    renderMode: () => props.renderMode,
    precompiled: () => undefined,
    restart: () => [
      props.renderMode,
      props.dpr,
      props.cell,
      code(),
      props.seed,
      props.color,
      props.colors,
      props.mono,
      props.dither,
      props.levels,
      props.shade,
      props.speed,
      props.channels,
    ],
    frameRate: () => props.frameRate,
    render: draw,
  })

  props.ref?.({ surface })

  return (
    <div
      ref={(el) => (wrap = el)}
      role="img"
      aria-label={props.label}
      data-state={status()}
      class={cn(styles.frame, props.xstyle, props.class)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
    >
      <canvas ref={(el) => (canvas = el)} {...stylex.props(styles.canvas)} style={{ "image-rendering": "pixelated" }} />
      <Show when={note()}>
        <p {...stylex.props(styles.p)} aria-live="polite">
          {note()}
        </p>
      </Show>
    </div>
  )
}
