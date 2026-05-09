# Plot Editor Store — Refactor Design

## Context

`projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (~720 LOC) contains three forms of duplication:

1. **Interactive-mode boilerplate.** Twelve near-identical methods (`startInteractive*`, `cancelInteractive*`, `finishInteractive*`) — the four `cancel*` methods are literally identical.
2. **Preview/commit divergence risk.** The "add area/marker/line/fx based on interactive points" logic is implemented twice — once read-only inside the `previewModel` computed, and once for the actual commit inside `finishInteractive*` and `onPlotClick`. Both paths can drift apart silently.
3. **Repetitive collection patterns.** `addFx`/`addMarker`/`addLine`/`addArea` and their `remove*` counterparts repeat the same shape (color cycling via `colors[X.length % colors.length]`, immutable splice, marker-name generation).

The refactor unifies all three areas while keeping the file as a single store module.

## Goals & Non-Goals

**Goals**

- Eliminate the preview/commit duplication by sharing one code path.
- Replace the twelve interactive-mode methods with four generic ones.
- Tighten the collection methods using small, reusable helpers.
- Add unit tests for the new pure helpers.
- Preserve all current user-visible behavior.

**Non-Goals**

- No UX changes (Add buttons keep adding default items; interactive mode keeps clicking on the plot).
- No new features.
- No file split — everything stays inside `plot-editor.store.ts`. Helpers are top-level exports for testability.
- No tests for the signal store itself (cost/benefit too low; routing, Word service, plot generation would all need mocking).

## Constraints

- The public store API may change. Templates and `plot-editor.ts` will be updated in lockstep.
- Project rule: signal forms only, no Reactive/Template forms; OnPush; signals for state. The refactor stays compliant.
- File stays in one place: `plot-editor.store.ts`.

## Architecture

### Top-level pure helpers (above the store)

```ts
type Point = { x: number; y: number };

interface ApplyContext {
  scheme: MarkerNamingScheme;
  markerNamingService: MarkerNamingService;
}

interface InteractiveStrategy {
  /** Minimum points required for `finishInteractive()` to commit. */
  minPoints: number;
  /** If set, `onPlotClick` auto-commits when click count reaches this. */
  autoFinishAt?: number;
  /** Pure: produces a new Plot with the interactive points applied. */
  apply(model: Plot, points: ReadonlyArray<Point>, ctx: ApplyContext): Plot;
}

const INTERACTIVE_STRATEGIES: Record<Exclude<InteractiveMode, InteractiveMode.Off>, InteractiveStrategy> = {
  [InteractiveMode.Area]: { minPoints: 3, apply: applyArea },
  [InteractiveMode.Marker]: { minPoints: 1, apply: applyMarker },
  [InteractiveMode.Line]: { minPoints: 2, autoFinishAt: 2, apply: applyLine },
  [InteractiveMode.StraightLine]: { minPoints: 2, autoFinishAt: 2, apply: applyStraightLine },
};
```

Each `apply*` is an exported top-level function. Each handles the partial case (e.g. `applyLine` returns the model unchanged when `points.length < 2`). This makes the same function safe for both `previewModel` (any point count) and the commit paths (validated by `minPoints`/`autoFinishAt`).

**Strategy summaries:**

- `applyArea(model, points, ctx)` — when `points.length === 0`, returns model unchanged; otherwise appends one area with labeled points (`nameAreaPoints`), `nextColor(model.areas.length)`, `showPoints: false`.
- `applyMarker(model, points, ctx)` — when `points.length === 0`, returns model unchanged; otherwise appends one marker per point, names continued from `model.markers.length`.
- `applyLine(model, points)` — when `points.length < 2`, returns model unchanged; otherwise appends one line `(p[0], p[1])` with `nextColor(model.lines.length)`, `lineStyle: 'solid'`.
- `applyStraightLine(model, points)` — when `points.length < 2`, returns model unchanged; computes `calculateStraightLineFunction(p[0], p[1])`; if `null` (vertical line), returns model unchanged; otherwise appends an fnx with the computed expression, `nextColor(model.fnx.length)`, `legendPosition: 'none'`, `lineStyle: 'solid'`.

### Additional helpers (top-level, exported)

- `nextColor(count: number): string` — replaces `colors[X.length % colors.length]`.
- `removeAt<T>(arr: ReadonlyArray<T>, index: number): T[]` — immutable splice.
- `nameAreaPoints(points, scheme, service, startIndex): AreaPoint[]` — maps raw points to labeled `AreaPoint` entries.
- `calculateStraightLineFunction` — already exists; promoted to `export` for direct testing.

### Store methods — interactive

```ts
startInteractive(mode: Exclude<InteractiveMode, InteractiveMode.Off>): void {
  patchState(store, { interactiveMode: mode, interactivePoints: [] });
}

cancelInteractive(): void {
  patchState(store, { interactiveMode: InteractiveMode.Off, interactivePoints: [] });
}

finishInteractive(): void {
  const mode = store.interactiveMode();
  if (mode === InteractiveMode.Off) return;
  const strategy = INTERACTIVE_STRATEGIES[mode];
  const points = store.interactivePoints();
  if (points.length >= strategy.minPoints) {
    store.model.update(m => strategy.apply(m, points, ctx()));
  }
  patchState(store, { interactiveMode: InteractiveMode.Off, interactivePoints: [] });
}

onPlotClick(event: PlotClickEvent): void {
  const mode = store.interactiveMode();
  if (mode === InteractiveMode.Off) return;
  const strategy = INTERACTIVE_STRATEGIES[mode];
  const points = [...store.interactivePoints(), event];
  if (strategy.autoFinishAt && points.length >= strategy.autoFinishAt) {
    store.model.update(m => strategy.apply(m, points, ctx()));
    patchState(store, { interactiveMode: InteractiveMode.Off, interactivePoints: [] });
  } else {
    patchState(store, { interactivePoints: points });
  }
}
```

`removeInteractivePoint(index)` stays as is. `cancelInteractiveIfActive()` is removed — `cancelInteractive()` is idempotent and can replace all callers.

### `previewModel` computed

```ts
previewModel: computed<Plot>(() => {
  const model = store.model();
  const mode = store.interactiveMode();
  if (mode === InteractiveMode.Off) return model;
  return INTERACTIVE_STRATEGIES[mode].apply(
    model,
    store.interactivePoints(),
    { scheme: store.plotSettings().markerNamingScheme, markerNamingService },
  );
}),
```

Preview and commit share the exact same code path. Drift is structurally impossible.

### Store methods — collections

`add*` methods stay per type (each builds a different shape) but use `nextColor` and the marker-naming helpers. `remove*` methods become one-liners via `removeAt`:

```ts
removeFx(index: number): void {
  store.model.update(m => ({ ...m, fnx: removeAt(m.fnx, index) }));
}
removeMarker(index: number): void {
  store.model.update(m => ({ ...m, markers: removeAt(m.markers, index) }));
}
removeLine(index: number): void {
  store.model.update(m => ({ ...m, lines: removeAt(m.lines, index) }));
}
removeArea(index: number): void {
  store.model.update(m => ({ ...m, areas: removeAt(m.areas, index) }));
}
removeAreaPoint({ areaIndex, pointIndex }): void {
  store.model.update(m => ({
    ...m,
    areas: m.areas.map((a, i) =>
      i === areaIndex ? { ...a, points: removeAt(a.points, pointIndex) } : a,
    ),
  }));
}
```

`addArea` / `addMarker` / `addLine` / `addFx` / `addAreaPoint` are kept and tightened: color via `nextColor`, area-point naming via `nameAreaPoints`, single-name generation via `markerNamingService.generateName(...)`.

## Consumer Updates

**Section components** — each section component exposes `protected readonly InteractiveMode = InteractiveMode` so its template can call `store.startInteractive(InteractiveMode.X)`:

| Section         | Old call                                | New call                                               |
| --------------- | --------------------------------------- | ------------------------------------------------------ |
| section-areas   | `store.startInteractiveArea()`          | `store.startInteractive(InteractiveMode.Area)`         |
|                 | `store.finishInteractiveArea()`         | `store.finishInteractive()`                            |
|                 | `store.cancelInteractiveArea()`         | `store.cancelInteractive()`                            |
| section-markers | `store.startInteractiveMarker()`        | `store.startInteractive(InteractiveMode.Marker)`       |
|                 | `store.finishInteractiveMarker()`       | `store.finishInteractive()`                            |
|                 | `store.cancelInteractiveMarker()`       | `store.cancelInteractive()`                            |
| section-lines   | `store.startInteractiveLine()`          | `store.startInteractive(InteractiveMode.Line)`         |
|                 | `store.cancelInteractiveLine()`         | `store.cancelInteractive()`                            |
| section-fnx     | `store.startInteractiveStraightLine()`  | `store.startInteractive(InteractiveMode.StraightLine)` |
|                 | `store.cancelInteractiveStraightLine()` | `store.cancelInteractive()`                            |

**`plot-editor.ts`** — `cancelInteractiveIfActive()` → `cancelInteractive()`.

## Data Flow

Interactive mode flow (post-refactor):

1. User clicks "Start interactive" in a section → `startInteractive(mode)` sets `interactiveMode` and clears points.
2. User clicks on plot → `onPlotClick(event)` appends point. If `autoFinishAt` reached, commits via `strategy.apply` and resets.
3. Otherwise user clicks "Finish" or "Cancel":
   - Finish → `finishInteractive()` validates `minPoints`, commits via `strategy.apply` if met, resets.
   - Cancel → `cancelInteractive()` resets without committing.
4. Throughout, `previewModel` shows `strategy.apply(model, currentPoints, ctx)` so the user sees the in-progress shape live.

## Error Handling

- All `apply*` functions are total over their input — they never throw, they fall back to returning the model unchanged for partial/invalid input.
- `finishInteractive` already silently no-ops when below `minPoints` (matches current behavior).
- `applyStraightLine` silently no-ops when the line is vertical (current behavior — `calculateStraightLineFunction` returns `null`).
- No new error surfaces are introduced.

## Testing

New file: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`. Pure-function tests only — no `TestBed`, no signal-store integration tests.

Coverage:

- `nextColor` — modulo wrap across all four colors.
- `removeAt` — first/middle/last index, immutability of input.
- `nameAreaPoints` — naming respects `startIndex` and `scheme` (via stub `MarkerNamingService`).
- `INTERACTIVE_STRATEGIES.Area`
  - 0 points → unchanged
  - 1–2 points → partial area added (preview path)
  - 3+ points → full area, `nextColor` based on existing area count
  - point labels start at `getNextLabelIndex(model)`
- `INTERACTIVE_STRATEGIES.Marker`
  - 0 points → unchanged
  - n points → n markers, names continue after existing
- `INTERACTIVE_STRATEGIES.Line`
  - <2 points → unchanged
  - exactly 2 points → line added with cycled color
- `INTERACTIVE_STRATEGIES.StraightLine`
  - <2 points → unchanged
  - vertical line (p1.x === p2.x) → unchanged
  - other → fnx added with computed expression
- `calculateStraightLineFunction` — vertical, m=0, m=±1, b=0, generic case.

`MarkerNamingService` is stubbed inline: `{ generateName: (i, _scheme) => 'P' + i }`.

## Verification

- `ng build` for type-check.
- `ng lint` for lint.
- Manual UAT by the user across the plot editor (new plot, edit existing, all four interactive modes, add/remove for each section, preview correctness during interaction). The agent will not start the dev server.

## Risk & Rollback

- Risk: subtle behavior drift between old per-mode methods and new strategy. Mitigation: the strategy `apply` functions are direct ports of the existing logic; tests assert key cases.
- Risk: vertical-line StraightLine handling. Mitigation: explicit test case for `p1.x === p2.x`.
- Rollback: single PR, can be reverted atomically.
