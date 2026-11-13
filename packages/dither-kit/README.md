# dither-kit

Dithered UI toolkit for Solid: composable ordered-dither **charts** (area,
line, bar, pie, radar) on one tiny canvas engine, plus generative **avatars**,
**buttons**, **gradient washes** and friends. The kit of
[dither-ui](https://dither-ui.com).

This package ships **source** (`.ts` + `.tsx`), like shadcn-style kits: your
bundler compiles it with your app. It is one kit in layers, the folders of
`src/`: `engine/` is the styling-free logic every layer shares (rasters,
painters, chart and field contexts, the clock, `theme.css` and `theme.ts`),
`solid/` holds the SolidJS components styled with Tailwind classes, the
package's main entry (`src/solid/index.ts`), and `tailwind/` what the
Tailwind layer shares (the class helpers and `kit.css`). The same components
in StyleX are a package of their own, `dither-kit-stylex`, generated from
these: a StyleX app takes it beside this one, compiles it with its StyleX
plugin, loads `engine/theme.css` and `engine/base.css`, and passes its own
styles to any component as `xstyle`. To copy the kit instead of installing
it, take `src/` whole (`npx degit drvova/dither-ui/packages/dither-kit/src
src/dither-kit`) and alias `@dither-kit` to its `solid/` folder.
Requirements for the Tailwind layer:

- Vite (or any bundler) with `vite-plugin-solid`, on `solid-js` 1.9
- Tailwind CSS for the chrome classes (`text-muted-foreground`, `stroke-border`, …)
  with shadcn-style tokens (`--foreground`, `--card`, `--border`, `--popover`;
  `engine/theme.css` declares them) — or no Tailwind at all: the repository's
  `npm run build:css` compiles `tailwind/kit.css` (the tokens, the `.dither-kit`-scoped `base.css`, every
  class the components use) into `kit/dither-kit.css` of the site's build, also served at
  dither-ui.com/kit/dither-kit.css. Load it, wrap the region in `.dither-kit`,
  and style the rest with StyleX, UnoCSS, plain CSS or any CSS-in-JS;
  `engine/theme.ts` (`applyTheme`, `themeCss`, `themeVars`) sets the tokens from JS.

```ts
import { AreaChart, Area, Grid, XAxis, YAxis, Legend, Tooltip } from "dither-kit"
```

```tsx
<div class="h-80">
  <AreaChart data={data} config={config} bloom="low">
    <Grid />
    <XAxis dataKey="month" />
    <YAxis />
    <Area dataKey="desktop" isClickable />
    <Legend isClickable />
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
as it mounts. `DitherButton` uses the same pattern for its `resize()`
call.
`paintToggleCanvas` (shared by DitherToggle and DitherToggleGroup) uses
`RasterBuffer` + `putRasterBuffer` instead of per-pixel `fillRect`.

Keep `animate`, `sparkles`, and bloom off for static content, and use the
precompiled path for content whose data and dimensions are known on the server.

The package's benchmarks are run by hand: `npm run bench` times the engine's
hot paths in Node (the per-pixel writes, the gradient compiler and a chart
column), and `npm run bench:browser` mounts the Solid components in headless
Chromium and compares the gradient's `fillRect` and `putImageData` painters
and button fresh-buffer versus reused-buffer rendering. See the root README
for the figures and the machine they were measured on.
