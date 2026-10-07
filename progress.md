# progress.md — session log

- 2026-10-07 W0: pasted taxonomy audited (624 items, ~118 shipped, ~506 gaps).
  Script `.scratch/roadmap-audit.mjs` → `.scratch/roadmap-coverage.json`.
  Planning files created (task_plan/findings/progress). Waves W1–W7 defined in
  task_plan.md; DoD per item written from repo DOX contracts.
- 2026-10-07 W1 batch 1 COMPLETE: DitherBox, DitherText, DitherDivider,
  DitherVisuallyHidden shipped — kit files + index exports (Dither* naming
  enforced by tests/component-registry.spec.ts: registry `is` must match
  /^Dither[A-Z]/ and equal the public Dither* export set exactly), new docs
  pack `primitives/` + PRIMITIVES_NAV group (Overview → Primitives →
  Handbook), 4 registry entries, 8 tests (primitives.spec.ts).
  Gate: tsc green, 237/237 tests, build+prerender green, deep link
  /docs/box verified on phone viewport, all 4 sections + 9 TOC groups live.
  Next: W1 batch 2 (remaining Primitives: Icon/IconSet decision, Svg, Image,
  Spacer, Portal, Overlay, Measure, Clipboard, ClickOutside, Pressable…) —
  see task_plan.md.
