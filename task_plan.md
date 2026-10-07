# task_plan.md — roadmap coverage (paste-1 taxonomy → shipped kit)

Goal: every item in the pasted 44-category taxonomy (624 counted entries) is either
SHIPPED (component + registry + docs + tests + a11y) or explicitly WAIVED with a
written reason. Source list: `.scratch/paste-list.txt`; audit script + output:
`.scratch/roadmap-audit.mjs`, `.scratch/roadmap-coverage.json`.

Status legend: pending | in_progress | complete | waived

## Current state (audit, case-normalized matcher)

| total | shipped | gap |
|---|---|---|
| 624 | ~118 | ~506 |

Per-category (have/total): 01 Primitives 4/26 · 02 Typography 9/33 · 03 Layout 17/39 ·
04 Window&Shell 7/24 · 05 Buttons 6/17 · 06 Forms 14/49 · 07 Navigation 5/14 ·
08 Menus 4/8 · 09 Overlays 5/8 · 10 Feedback 5/13 · 11 Loading 7/21 ·
12 Data Display 5/18 · 13 Lists 1/13 · 14 Tables 1/11 · 15 Charts 4/14 ·
16 Finance 1/22 · 17 Editor 1/12 · 18 Terminal 1/5 · 19 Git 0/7 · 20 Debug 1/6 ·
21 Documents 0/18 · 22 Collaboration 1/8 · 23 AI Chat 1/19 · 24 Agent 0/13 ·
25 Generative 2/16 · 26 Media 2/21 · 27 Files 3/20 · 28 Messaging 1/16 ·
29 Mail 0/10 · 30 Calendar 0/10 · 31 Project 0/14 · 32 Canvas&Design 1/9 ·
33 DB&Dev 0/11 · 34 Dashboard 2/4 · 35 Settings 0/1 · 36 Account 0/10 ·
37 Onboarding 1/7 · 38 Interaction 0/7 · 39 Theme 3/11 · 40 i18n&a11y 1/5 ·
41 Maps 1/7 · 42 Misc 1/16 · 43 Library Tooling 0/10 · 44 Rendering 0/1.

Matcher is fuzzy: re-verify each item against `dither-kit/*.vue` (walk, not grep)
before building — several "missing" rows are PARTIAL (PasswordInput = DitherInput
with type=password, SearchInput = DitherInput + icon slot).

## Definition of done (per item)

1. Component in `dither-kit/` (portable, zero `src/` imports, tokens not raw hex,
   seed contract where a visual input exists).
2. Exported from `dither-kit/index.ts`; svelte mirror in `dither-kit-svelte` for
   kit families (Vue-first, mirror lands with the wave — docs framework toggle
   must stay honest).
3. Studio registry entry (`entities/widget/model/registry.ts`) — functional demo.
4. Docs: section in the owning pack + nav id (`*-nav.ts`), snippet, PropsTable.
   New families get a new pack folder per `pages/AGENTS.md` (self-contained
   component + sibling nav).
5. Tests in `tests/` where behavior is non-trivial; a11y floor (labels, focus
   ring, roles, reduced motion).
6. Gate: `npx vue-tsc --noEmit` + `npm test` + `npm run build` green; visual
   check via agent-browser for anything rendered; commit per batch.

## Waves

- W0 foundation audit — complete (numbers above; matcher lesson in findings.md)
- W1 primitives/typography/layout gaps (~50) — in_progress (batch 1 complete:
  DitherBox/DitherText/DitherDivider/DitherVisuallyHidden; batch 2 next —
  Icon/IconSet decision first)
- W2 buttons + forms completions + interaction (~70) — pending
- W3 navigation/menus/overlays/feedback/loading/data-display (~80) — pending
- W4 lists + tables + dashboard (~50) — pending
- W5 charts + finance (dithered canvas, showcase value) (~50) — pending
- W6 theme + i18n/a11y + library tooling (~40) — pending
- W7 app suites, split W7a Window&Shell+Editor+Terminal+Git+Debug,
  W7b Documents+Collaboration+AI+Agent+Generative, W7c Media+Files+Messaging+Mail,
  W7d Calendar+Project+Canvas+DB, W7e Account+Onboarding+Maps+Misc+Settings
  (~190 total) — pending

## Flags (decisions folded into waves when reached)

- Icon/IconSet: no icon set in repo today (text glyphs only). Needs a hand-rolled
  SVG sprite decision (no new deps) — W1 sub-decision.
- Window&Shell / Tray / MultiWindow: web-scope equivalents (CSS drag regions,
  simulated chrome) unless a desktop shell lands.
- i18n: minimal in-kit composable (no vue-i18n dep) — design in W6.
- Heavy viewers (OfficePreview, EpubReader, Latex): scope to embed/canvas
  renders or waive with reason — decided per item in W7b.
- Vue-native waivers (documented in docs, no component): Show, For, Fragment,
  Slot, Suspense, Transition-as-impl (wrap only if a dithered variant ships).

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| audit reported 12/624 present | 1 | case-sensitive matcher; normalized both sides → 118 |
| `dither-kit-svelte/src` missing | 1 | recursive walk (folder layout differs) |
| python absent for session-catchup | 1 | fresh plan; catchup not needed |
