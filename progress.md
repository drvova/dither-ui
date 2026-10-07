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
- 2026-10-07 W1 batch 2 COMPLETE: Svg, Img (named DitherImg — DitherImage is
  the dither renderer), Spacer, Portal, Overlay, Measure, Clipboard,
  ClickOutside, FocusRing, FocusScope, HoverArea, Pressable, InView.
  17 sections in the Primitives pack, 13 registry entries, 13 new tests.
  Errors this batch (all logged): (1) shell-mangled inline node -e with
  backticks broke the pack patcher twice — scripts with template literals go
  through files; (2) SNIPPET_CLIPBOARD carried literal \` from an edit,
  killing compileScript; (3) <template #default> nested inside a native
  <button> crashes Vue codegen ("Codegen node is missing") — scoped slots
  belong on the component; same shape fixed in docs demo + test fixture;
  (4) test header lacked vi/nextTick imports; (5) "Image" label collided
  with DitherImage's section in the seo uniqueness test → "Image (plain)";
  (6) VTU emitted() cleared after unmount → spy via attrs onOutside.
  Gate: tsc green, 250/250 tests, build green, /docs/pressable verified.
