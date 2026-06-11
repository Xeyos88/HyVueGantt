# Gantt changes report — layout fill, zoom bounds, themeable border, vulnerability fixes

Date: 2026-06-11

This report documents changes made across two repositories. **No git commits or
branches were created** — all changes are in the working trees only.

- `HyVueGantt` — the `hy-vue-gantt` library (working tree on branch `feature/max-zoom`)
- `ops-portal-core` — the `@altecspace/ops-portal-core` wrapper (`CoreGanttChart`)

`ops-portal-exomars` (the consumer) was **not** modified; its follow-ups are listed at the end.

---

## 1. Layout fill fix (gantt fills its parent container again)

### Root cause
Library commit `932e71c` ("fix: emit click-timeaxis-event … and adjust chart layout",
Mar 10 2026) added `flex: 1; min-height: 0` to `.g-gantt-rounded-wrapper` and
`flex: 1; min-height: 0; overflow-y: auto` to `.g-gantt-main-layout`, plus
`height: 100%` to `.g-gantt-container`. But the inner chain — `.gantt-wrapper` →
`.g-gantt-chart` → `.g-gantt-rows-container` — was never made to fill. The chart
therefore collapsed to its content height and the commands bar was no longer pinned
to the bottom of the parent (it sat right under the last row). This shipped in 5.2.0,
which is what broke when `ops-portal-core` was bumped (1.2.1 → 1.4.0) in exomars.

### Fix — `HyVueGantt/src/components/GGanttChart.vue` (style block)
- Added a rule so the chart wrapper fills the layout column and becomes a flex column:
  ```css
  .g-gantt-main-layout > .gantt-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  ```
  The **child combinator** is used on purpose: `.gantt-wrapper` is a generic class
  name also used by consumer apps (e.g. exomars `TacticalPlanningCycleWidget` has its
  own scoped `.gantt-wrapper`), so the rule must not leak.
- `.g-gantt-chart`: added `flex: 1; min-height: 0;` so it fills `.gantt-wrapper`.
- `.g-gantt-rows-container`: changed `height: 100%` → `flex: 1; min-height: 0;` so the
  rows area takes the space left after the time axis (avoids the time-axis + 100%
  overlap that `height: 100%` would cause once the chart has a definite height).

Result chain (all flex columns with `min-height: 0`): container → rounded-wrapper →
main-layout → gantt-wrapper → g-gantt-chart → [timeaxis (auto)] + [rows-container
(flex: 1)], with the commands bar pinned at the bottom of the rounded-wrapper.

Backward compatible: in content-sized contexts (no definite parent height), the whole
flex chain still resolves to content height as before.

---

## 2. Configurable zoom bounds (`maxZoom` / `minZoom`)

Previously the zoom range was hardcoded (`MAX_ZOOM = 10`, `MIN_ZOOM = 1`) in
`useTimeaxisUnits.ts`. Now both are props with **hard caps** enforced regardless of
what a consumer passes:

- `maxZoom` clamped to `[1, 20]` (default **10**)
- `minZoom` clamped to `[1, maxZoom]` (default **1**)
- `defaultZoom` clamped into the resulting `[minZoom, maxZoom]` range

Zoom is linear (`unitWidth = baseUnitWidth * zoomLevel`), so values up to 20 are safe.
Defaults are unchanged → fully backward compatible.

### Files
- `HyVueGantt/src/types/config.ts` — added `maxZoom?: number` and `minZoom?: number`
  to `GGanttChartProps` (terse, matching the surrounding props). `GGanttChartConfig`
  (`ToRefs<Required<GGanttChartProps>>`) picks them up automatically.
- `HyVueGantt/src/components/GGanttChart.vue`:
  - `withDefaults`: `maxZoom: 10`, `minZoom: 1`.
  - Added `ZOOM_HARD_MIN = 1`, `ZOOM_HARD_MAX = 20`, a `clampZoom(value, lower, upper)`
    helper, and `validatedMaxZoom` / `validatedMinZoom` / `validatedDefaultZoom` refs
    (mirrors the existing `validatedBaseUnitWidth` / `validatedDefaultZoom` pattern).
  - A single watcher on `[maxZoom, minZoom, defaultZoom]` recomputes the three
    validated refs (replaces the old `defaultZoom`-only watcher).
  - Passes `maxZoom`/`minZoom` (validated refs) into the `useTimeaxisUnits({...})` call
    and into `provide(CONFIG_KEY, {...})`.
  - `restoreZoom(zoom, precision)` now clamps `zoom` into `[validatedMinZoom,
    validatedMaxZoom]` (JSDoc updated accordingly).
- `HyVueGantt/src/composables/useTimeaxisUnits.ts`:
  - Added `maxZoom`/`minZoom` computeds reading from the config with the module-level
    `MAX_ZOOM`/`MIN_ZOOM` constants kept as **defensive fallbacks** (some tests build a
    partial config without these refs).
  - `canZoomIn`, `canZoomOut` and `adjustZoomAndPrecision` now use `maxZoom.value` /
    `minZoom.value` (`>=` / `<=`) instead of the hardcoded constants.

---

## 3. Theme-able outer border (driven by `ColorScheme.gridAndBorder`)

The outer frame and the commands-bar separator were hardcoded to `#eaeaea`, which
rendered as a near-white line — visible above the commands bar in dark mode. Per the
chosen approach, the existing `gridAndBorder` scheme field now drives them (no new
field added).

### Files
- `HyVueGantt/src/components/GGanttChart.vue`:
  - `.g-gantt-rounded-wrapper` inline style now also sets
    `--g-gantt-border-color: colors.gridAndBorder ?? '#eaeaea'`.
  - CSS: `.g-gantt-rounded-wrapper` `border` and `.g-gantt-command` `border-top` now use
    `var(--g-gantt-border-color, #eaeaea)`.
  - Backward compatible: all 11 built-in schemes already set `gridAndBorder: '#eaeaea'`,
    so default rendering is unchanged. A custom scheme can pass `transparent` to remove
    the frame.
- `ops-portal-core/src/gantt/CoreGanttChart.vue`:
  - Removed the `:deep(.g-gantt-rounded-wrapper) { border-color: transparent }` override
    (replaced with an explanatory comment) so the theme-aware border shows. The core
    schemes already define `gridAndBorder` per theme: **dark `#334155`**, **light
    `#cbd5e1`** — no scheme value changes were needed.

---

## 4. Library pass-through in ops-portal-core

- `ops-portal-core/src/gantt/types.ts` — added `maxZoom?` / `minZoom?` to `GanttConfig`
  (with JSDoc, matching the `defaultZoom` style).
- `ops-portal-core/src/gantt/CoreGanttChart.vue` — added `:max-zoom="mergedConfig.maxZoom"`
  and `:min-zoom="mergedConfig.minZoom"` to the `<GGanttChart>` bindings.
  - Deliberately **not** added to `DEFAULT_CONFIG`: when a consumer omits them they stay
    `undefined`, so Vue treats the prop as not passed and the library defaults (10 / 1)
    apply.

---

## 5. Documentation updates (HyVueGantt)

- `docs/api/props.md` — added `maxZoom` / `minZoom` rows (limits noted as `[1, 20]`).
- `docs/guide/chart-configuration.md` — new "Zoom Bounds" subsection with an example.
- `docs/api/types.md` — documented that `ColorScheme.gridAndBorder` also drives the
  outer border + commands-bar top border (set `transparent` to remove; falls back to
  `#eaeaea`).
- `docs/guide/styling.md` — same note plus a custom color-scheme example.
- `CHANGELOG.md` was intentionally **not** edited: it is generated by semantic-release.

---

## 6. Vulnerabilities (HyVueGantt)

`npm audit fix` was run (no `--force`). Only `package-lock.json` changed — no direct
dependency version bumps in `package.json`.

| Stage | Total | Critical | High | Moderate |
|-------|------:|---------:|-----:|---------:|
| Before | 25 | 3 | 3 | 19 |
| After  | 17 | 0 | 1 | 16 |

Fixed: the 3 criticals (`vitest`, `@vitest/coverage-v8`) and the original highs, plus
several moderate chains (uuid, shell-quote, etc.).

Remaining 17 are **all dev-tooling only** (production/runtime deps are clean) and are
not safely fixable:
- 3 inside `npm@11.12.1`'s own bundled deps (`brace-expansion`, `ip-address`,
  `picomatch` — the lone remaining high), pulled in by `semantic-release` →
  `@semantic-release/npm`. These live in `node_modules/npm/node_modules/**` (npm's
  bundled dependencies) and are release-tooling only — never shipped to consumers.
- `esbuild`/`vite` via `vitepress` (docs site) — **no fix available** without a
  vitepress major bump.
- `markdown-it` + `@mdit-vue/*` + `@vuepress/*` chain — only fixable via
  `npm audit fix --force`, which would install `@vuepress/plugin-search@2.0.0-rc.130`
  (outside the stated range) — a breaking change, out of scope for "minimal and safe".

---

## 7. Verification performed (code-level only — no integration linking, no visual checks)

HyVueGantt:
- `npm run typecheck` (vue-tsc --noEmit) — clean.
- `npx vitest run` — **443 passed, 27 skipped** (pre-existing skips), 0 failures.
- `npm run build` (types + lib) — succeeds (`lib/hy-vue-gantt.js`, 170.78 kB).

ops-portal-core:
- `npm run type-check` (vue-tsc) — clean (the new `:max-zoom` binding does not error
  even against the installed `hy-vue-gantt@5.2.0`, which predates the props).
- `npm run build` — succeeds.
- `npx vitest run` — **623 passed, 1 skipped**, 0 failures.

---

## 8. Follow-ups left to the user

1. **Commit** the working-tree changes in both repos with conventional messages
   (e.g. `fix:` for the layout/border, `feat:` for the zoom props in HyVueGantt).
2. **Release HyVueGantt** via semantic-release. The `feat:` (zoom props) implies a minor
   bump → **5.3.0** (the docs reference v5.3.0).
3. **ops-portal-core**: after 5.3.0 is published, bump `hy-vue-gantt` `^5.1.0` → `^5.3.0`
   in `peerDependencies` and `devDependencies`, then release core and publish to the
   Altec nexus registry. (Local core is currently at version 1.3.0.)
4. **ops-portal-exomars**: bump `hy-vue-gantt` `^5.2.0` → `^5.3.0` and
   `@altecspace/ops-portal-core` to the new core version; `npm install`.
5. **Optional**: pass `maxZoom: 20` (and/or `minZoom`) in the exomars widget configs
   (`GanttChart.vue` tactical-cycle, `ShiftsGanttView.vue`) where wider zoom is wanted.
   No exomars code was changed in this task.
