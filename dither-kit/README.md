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
cubic-bézier points — see the studio and docs in the repository for the full
surface.
