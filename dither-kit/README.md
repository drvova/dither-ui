# dither-ui

Dithered UI toolkit for Vue 3 — composable ordered-dither **charts** (area,
line, bar, pie, radar) on one tiny canvas engine, plus generative **avatars**,
**buttons**, **gradient washes** and friends.

This package ships **source** (`.ts` + `.vue`), like shadcn-style kits: your
bundler compiles it with your app. Requirements:

- Vite (or any bundler) with `@vitejs/plugin-vue`
- Tailwind CSS for the chrome classes (`text-muted-foreground`, `stroke-border`, …)
  with shadcn-style tokens (`--foreground`, `--card`, `--border`, `--popover`)

```ts
import { AreaChart, Area, Grid, XAxis, YAxis, Legend, Tooltip } from "dither-ui"
```

```vue
<div class="h-80">
  <AreaChart :data="data" :config="config" bloom="low">
    <Grid />
    <XAxis dataKey="month" />
    <YAxis />
    <Area dataKey="desktop" is-clickable />
    <Legend is-clickable />
    <Tooltip labelKey="month" />
  </AreaChart>
</div>
```

Every visual knob is a prop: colors accept palette names, hue numbers or hex;
`variant` accepts presets or a full texture config; `bloom` accepts presets or
`{ blur, brightness, opacity, saturate }`; `easing` accepts presets or
cubic-bezier points.

## Server precompilation

`renderDitherGradient()` and `renderDitherButton()` are dependency-free
server-safe compilers. They return `{ width, height, data }` RGBA buffers that
can be encoded by the host application with PNG/WebP tooling such as `sharp`:

```ts
const raster = renderDitherGradient({ width: 960, height: 600, cell: 2, seed: 42 })
const png = await sharp(Buffer.from(raster.data), {
  raw: { width: raster.width, height: raster.height, channels: 4 },
}).png().toBuffer()
```

Pass the resulting public URL as `precompiled` to a chart root or standalone
surface. The kit currently exports compilers for gradient and button rasters;
chart, image, and spinner precompiled URLs are consumed by the kit but generated,
encoded, cached, and invalidated by the host app. The chart image replaces the
dither canvas while its SVG and DOM children remain available. Use
`renderMode="static"` when a client paint is needed but animation and resize
observation are unnecessary. In static mode, `maxCols`/`maxRows` props
auto-default to `STATIC_DEFAULT_MAX_COLS` (320) and `STATIC_DEFAULT_MAX_ROWS`
(200) for 4× less compute than live mode's `DEFAULT_MAX_COLS` (960) /
`DEFAULT_MAX_ROWS` (600). Override per-instance with explicit `maxCols`/
`maxRows` values. Static mode also defers initial paint through
`requestIdleCallback` (with `setTimeout` fallback) so decorative surfaces never
block first contentful paint.

## Client cost controls

`cell` controls backing resolution; larger cells mean fewer pixels to compute.
The kit also pauses chart RAF loops while invisible, batches standalone surface
pixels through one `putImageData`, and copies bloom layers only after a changed
frame. `createRasterBuffer()` and `putRasterBuffer()` are exported for host code
that wants the same reusable RGBA-buffer upload path. `setRasterPixel32()`
writes opaque pixels via a `Uint32Array` view for ~1.5× faster writes when
blending is not needed. `setOrBlendRasterPixel()` fast-paths the common case
where the destination buffer is freshly cleared (direct write) and falls back
to full source-over blend only when destination has content.

All primary canvas contexts are created with `{ willReadFrequently: true }`
so the browser uses software-accelerated 2D context for `putImageData`-heavy
surfaces. Bloom canvases omit the flag because they only use `drawImage`.

Standalone components defer their initial layout read (`getBoundingClientRect()`)
to `requestAnimationFrame` so multiple components mounting simultaneously batch
into one layout pass instead of forcing a synchronous reflow per component
inside Vue's `flushJobs`. `DitherButton` uses the same pattern for its `resize()`
call.
`paintToggleCanvas` (shared by DitherToggle and DitherToggleGroup) uses
`RasterBuffer` + `putRasterBuffer` instead of per-pixel `fillRect`.

Keep `animate`, `sparkles`, and bloom off for static content, and use the
precompiled path for content whose data and dimensions are known on the server.

The repository benchmark is available at `/benchmarks/`; it records six measured
batches after three warmups and reports mean, median, p95, canvas-call count, and
RGBA allocation count. It covers the large gradient `fillRect` → `putImageData`
path and button fresh-buffer versus reused-buffer rendering. See the root README
for the current local baseline and reproduction command.
