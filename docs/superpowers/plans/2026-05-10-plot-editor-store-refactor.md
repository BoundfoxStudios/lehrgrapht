# Plot Editor Store Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `plot-editor.store.ts` to eliminate three duplications: ~12 near-identical interactive-mode methods, the preview/commit divergence inside `previewModel` vs. `finishInteractive*`/`onPlotClick`, and the repetitive `add*`/`remove*` collection patterns.

**Architecture:** Introduce a `Record<InteractiveMode, InteractiveStrategy>` table (`INTERACTIVE_STRATEGIES`) used by both `previewModel` and the commit paths so they share a single code path. Replace the per-mode methods with four generic ones (`startInteractive(mode)`, `cancelInteractive()`, `finishInteractive()`, `onPlotClick(event)`). Extract three small pure helpers (`nextColor`, `removeAt`, `nameAreaPoints`) used inside the strategies and the surviving `add*`/`remove*` methods. Everything stays in `plot-editor.store.ts`; helpers and strategies are exported top-level functions tested in a new spec file.

**Tech Stack:** Angular 21, NgRx Signals (`signalStore`), TypeScript strict, Vitest (via `@angular/build:unit-test`, jsdom env), signal forms.

**Reference spec:** `docs/superpowers/specs/2026-05-10-plot-editor-store-refactor-design.md`

---

## File Structure

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` — add helpers + strategies, replace per-mode methods, tighten `add*`/`remove*` methods
- Create: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts` — unit tests for helpers + strategies + `calculateStraightLineFunction`
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.ts` — `cancelInteractiveIfActive()` → `cancelInteractive()`
- Modify: `projects/addin/src/app/components/plot-editor/sections/section-areas/section-areas.html` — call new generic store methods
- Modify: `projects/addin/src/app/components/plot-editor/sections/section-markers/section-markers.html` — same
- Modify: `projects/addin/src/app/components/plot-editor/sections/section-lines/section-lines.html` — same
- Modify: `projects/addin/src/app/components/plot-editor/sections/section-fnx/section-fnx.html` — same

Section TS files already expose `protected readonly InteractiveMode = InteractiveMode`; no TS changes needed there.

---

## Test Conventions

All tests live in `plot-editor.store.spec.ts`. Pure functions only — no `TestBed`. Top of file:

```ts
import { Plot } from '../../models/plot';
import { MarkerNamingService } from '../../services/marker-naming.service';
import { InteractiveMode } from './interactive-mode';
import { applyArea, applyLine, applyMarker, applyStraightLine, ApplyContext, calculateStraightLineFunction, INTERACTIVE_STRATEGIES, nameAreaPoints, nextColor, removeAt } from './plot-editor.store';

const basePlot: Plot = {
  version: '1.0.0',
  name: 'test',
  range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
  fnx: [],
  markers: [],
  areas: [],
  lines: [],
  showAxis: true,
  showAxisLabels: true,
  placeAxisLabelsInside: true,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
};

const ctx: ApplyContext = {
  scheme: 'numeric',
  markerNamingService: new MarkerNamingService(),
};
```

Each task adds a new `describe` block. Add the `import` line for the function under test at the time you create that task — by Task 8 the imports should match the block above.

Run tests with: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`

---

## Phase 1: Pure Helpers

### Task 1: Add `nextColor` helper

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts:28`
- Create: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `plot-editor.store.spec.ts` with the imports/constants from the Test Conventions section above (you can omit imports for functions that don't yet exist; add `nextColor` only). Then add:

```ts
describe('nextColor', () => {
  it('returns palette color for index within range', () => {
    expect(typeof nextColor(0)).toBe('string');
    expect(nextColor(0).startsWith('#')).toBe(true);
  });

  it('wraps modulo palette length', () => {
    expect(nextColor(0)).toBe(nextColor(4));
    expect(nextColor(1)).toBe(nextColor(5));
    expect(nextColor(2)).toBe(nextColor(6));
    expect(nextColor(3)).toBe(nextColor(7));
  });

  it('produces 4 distinct colors for 0..3', () => {
    const distinct = new Set([nextColor(0), nextColor(1), nextColor(2), nextColor(3)]);
    expect(distinct.size).toBe(4);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: build/import error for `nextColor` (not exported).

- [ ] **Step 3: Add `nextColor` in `plot-editor.store.ts`**

Locate the `colors` const at line 28 of `plot-editor.store.ts`. Immediately below it, add:

```ts
export function nextColor(count: number): string {
  return colors[count % colors.length];
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 3 specs pass.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add nextColor helper for plot-editor store"
```

---

### Task 2: Add `removeAt` helper

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after `nextColor`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `plot-editor.store.spec.ts` (and add `removeAt` to the import line):

```ts
describe('removeAt', () => {
  it('removes element at given index', () => {
    expect(removeAt([1, 2, 3, 4], 1)).toEqual([1, 3, 4]);
  });

  it('handles first index', () => {
    expect(removeAt([1, 2, 3], 0)).toEqual([2, 3]);
  });

  it('handles last index', () => {
    expect(removeAt([1, 2, 3], 2)).toEqual([1, 2]);
  });

  it('returns a new array, leaves input untouched', () => {
    const input = [1, 2, 3];
    const result = removeAt(input, 1);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `removeAt`.

- [ ] **Step 3: Add `removeAt` in `plot-editor.store.ts`**

Below `nextColor`, add:

```ts
export function removeAt<T>(arr: ReadonlyArray<T>, index: number): T[] {
  const next = [...arr];
  next.splice(index, 1);
  return next;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 4 new specs pass; total 7.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add removeAt helper for plot-editor store"
```

---

### Task 3: Add `nameAreaPoints` helper

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after `removeAt`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to spec (and import `nameAreaPoints`):

```ts
describe('nameAreaPoints', () => {
  const namer = new MarkerNamingService();

  it('maps each point to a labeled AreaPoint with auto labelPosition', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    const result = nameAreaPoints(points, 'numeric', namer, 0);
    expect(result).toEqual([
      { x: 0, y: 0, labelPosition: 'auto', labelText: 'P1' },
      { x: 1, y: 1, labelPosition: 'auto', labelText: 'P2' },
    ]);
  });

  it('starts naming at startIndex', () => {
    const points = [{ x: 0, y: 0 }];
    const result = nameAreaPoints(points, 'numeric', namer, 4);
    expect(result[0].labelText).toBe('P5');
  });

  it('respects scheme', () => {
    const points = [{ x: 0, y: 0 }];
    expect(nameAreaPoints(points, 'alphabetic', namer, 0)[0].labelText).toBe('A');
    expect(nameAreaPoints(points, 'numeric', namer, 0)[0].labelText).toBe('P1');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `nameAreaPoints`.

- [ ] **Step 3: Add `nameAreaPoints` in `plot-editor.store.ts`**

Add the import for `AreaPoint` at the top (alongside the existing `Plot`/`PlotSettings` import):

```ts
import { AreaPoint, Plot, PlotSettings, MarkerNamingScheme } from '../../models/plot';
```

(The existing import line is `import { Plot, PlotSettings } from '../../models/plot';` — extend it.)

Below `removeAt`, add:

```ts
export function nameAreaPoints(points: ReadonlyArray<{ x: number; y: number }>, scheme: MarkerNamingScheme, service: MarkerNamingService, startIndex: number): AreaPoint[] {
  return points.map((p, i) => ({
    x: p.x,
    y: p.y,
    labelPosition: 'auto',
    labelText: service.generateName(startIndex + i, scheme),
  }));
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 3 new specs pass; total 10.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add nameAreaPoints helper for plot-editor store"
```

---

### Task 4: Export and test `calculateStraightLineFunction`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts:82` (existing function — add `export`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to spec (and import `calculateStraightLineFunction`):

```ts
describe('calculateStraightLineFunction', () => {
  it('returns null for vertical line', () => {
    expect(calculateStraightLineFunction({ x: 1, y: 0 }, { x: 1, y: 5 })).toBeNull();
  });

  it('handles horizontal line (m === 0)', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 3 }, { x: 5, y: 3 })).toBe('3');
  });

  it('handles slope 1 with intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 1 }, { x: 1, y: 2 })).toBe('x+1');
  });

  it('handles slope -1 with no intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 0 }, { x: 1, y: -1 })).toBe('-x');
  });

  it('handles generic slope and negative intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: -2 }, { x: 1, y: 0 })).toBe('2*x-2');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `calculateStraightLineFunction`.

- [ ] **Step 3: Add `export` to existing function**

In `plot-editor.store.ts`, change line 82 from:

```ts
const calculateStraightLineFunction = (
```

to:

```ts
export const calculateStraightLineFunction = (
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 5 new specs pass; total 15.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): export and cover calculateStraightLineFunction"
```

---

## Phase 2: Strategy Functions

### Task 5: Define `InteractiveStrategy`, `ApplyContext`, and `applyArea`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after helpers, before `getNextLabelIndex`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to spec (and add `applyArea`, `ApplyContext` to imports):

```ts
describe('applyArea', () => {
  it('returns model unchanged with 0 points', () => {
    const result = applyArea(basePlot, [], ctx);
    expect(result).toBe(basePlot);
  });

  it('appends one area with labeled points (preview path with 2 points)', () => {
    const result = applyArea(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.areas.length).toBe(1);
    expect(result.areas[0].points.map(p => p.labelText)).toEqual(['P1', 'P2']);
    expect(result.areas[0].showPoints).toBe(false);
  });

  it('cycles color based on existing area count', () => {
    const oneArea = { ...basePlot, areas: [{ points: [], color: '#000', showPoints: false }] };
    const result = applyArea(oneArea, [{ x: 0, y: 0 }], ctx);
    expect(result.areas[1].color).toBe(nextColor(1));
  });

  it('continues label index from existing labeled points', () => {
    const seed: Plot = {
      ...basePlot,
      areas: [
        {
          points: [
            { x: 0, y: 0, labelPosition: 'auto', labelText: 'P1' },
            { x: 1, y: 0, labelPosition: 'auto', labelText: 'P2' },
          ],
          color: '#000',
          showPoints: true,
        },
      ],
    };
    const result = applyArea(seed, [{ x: 2, y: 0 }], ctx);
    expect(result.areas[1].points[0].labelText).toBe('P3');
  });

  it('does not mutate the input model', () => {
    const before = JSON.stringify(basePlot);
    applyArea(basePlot, [{ x: 0, y: 0 }], ctx);
    expect(JSON.stringify(basePlot)).toBe(before);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `applyArea`/`ApplyContext`.

- [ ] **Step 3: Add types and `applyArea`**

In `plot-editor.store.ts`, immediately above the existing `getNextLabelIndex` declaration, add:

```ts
export interface ApplyContext {
  scheme: MarkerNamingScheme;
  markerNamingService: MarkerNamingService;
}

export interface InteractiveStrategy {
  /** Minimum points required for `finishInteractive()` to commit. */
  minPoints: number;
  /** If set, `onPlotClick` auto-commits when click count reaches this. */
  autoFinishAt?: number;
  /** Pure: produces a new Plot with the interactive points applied. */
  apply(model: Plot, points: ReadonlyArray<{ x: number; y: number }>, ctx: ApplyContext): Plot;
}
```

Then below the existing `getNextLabelIndex` declaration, add `applyArea`:

```ts
export function applyArea(model: Plot, points: ReadonlyArray<{ x: number; y: number }>, ctx: ApplyContext): Plot {
  if (points.length === 0) return model;
  const startIndex = getNextLabelIndex(model);
  return {
    ...model,
    areas: [
      ...model.areas,
      {
        points: nameAreaPoints(points, ctx.scheme, ctx.markerNamingService, startIndex),
        color: nextColor(model.areas.length),
        showPoints: false,
      },
    ],
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 5 new specs pass; total 20.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add InteractiveStrategy types and applyArea"
```

---

### Task 6: Add `applyMarker`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after `applyArea`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to spec (and import `applyMarker`):

```ts
describe('applyMarker', () => {
  it('returns model unchanged with 0 points', () => {
    expect(applyMarker(basePlot, [], ctx)).toBe(basePlot);
  });

  it('appends one marker per point with names continuing from existing count', () => {
    const seed = { ...basePlot, markers: [{ x: 9, y: 9, text: 'P1' }] };
    const result = applyMarker(
      seed,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.markers.length).toBe(3);
    expect(result.markers[1].text).toBe('P2');
    expect(result.markers[2].text).toBe('P3');
  });

  it('does not mutate input', () => {
    const before = JSON.stringify(basePlot);
    applyMarker(basePlot, [{ x: 0, y: 0 }], ctx);
    expect(JSON.stringify(basePlot)).toBe(before);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `applyMarker`.

- [ ] **Step 3: Add `applyMarker`**

Below `applyArea`:

```ts
export function applyMarker(model: Plot, points: ReadonlyArray<{ x: number; y: number }>, ctx: ApplyContext): Plot {
  if (points.length === 0) return model;
  return {
    ...model,
    markers: [
      ...model.markers,
      ...points.map((p, i) => ({
        x: p.x,
        y: p.y,
        text: ctx.markerNamingService.generateName(model.markers.length + i, ctx.scheme),
      })),
    ],
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 3 new specs pass; total 23.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add applyMarker strategy"
```

---

### Task 7: Add `applyLine`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after `applyMarker`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to spec (and import `applyLine`):

```ts
describe('applyLine', () => {
  it('returns model unchanged with <2 points', () => {
    expect(applyLine(basePlot, [], ctx)).toBe(basePlot);
    expect(applyLine(basePlot, [{ x: 0, y: 0 }], ctx)).toBe(basePlot);
  });

  it('appends one line using p[0] and p[1] with cycled color and solid style', () => {
    const result = applyLine(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.lines.length).toBe(1);
    expect(result.lines[0]).toEqual({
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
      color: nextColor(0),
      lineStyle: 'solid',
    });
  });

  it('does not mutate input', () => {
    const before = JSON.stringify(basePlot);
    applyLine(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(JSON.stringify(basePlot)).toBe(before);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `applyLine`.

- [ ] **Step 3: Add `applyLine`**

Below `applyMarker`:

```ts
export function applyLine(model: Plot, points: ReadonlyArray<{ x: number; y: number }>, _ctx: ApplyContext): Plot {
  if (points.length < 2) return model;
  const [p1, p2] = points;
  return {
    ...model,
    lines: [
      ...model.lines,
      {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: nextColor(model.lines.length),
        lineStyle: 'solid',
      },
    ],
  };
}
```

(`_ctx` is unused but kept for `InteractiveStrategy` signature compatibility.)

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 3 new specs pass; total 26.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add applyLine strategy"
```

---

### Task 8: Add `applyStraightLine`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after `applyLine`)
- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to spec (and import `applyStraightLine`):

```ts
describe('applyStraightLine', () => {
  it('returns model unchanged with <2 points', () => {
    expect(applyStraightLine(basePlot, [], ctx)).toBe(basePlot);
    expect(applyStraightLine(basePlot, [{ x: 0, y: 0 }], ctx)).toBe(basePlot);
  });

  it('returns model unchanged for vertical line (calculateStraightLineFunction returns null)', () => {
    const result = applyStraightLine(
      basePlot,
      [
        { x: 1, y: 0 },
        { x: 1, y: 5 },
      ],
      ctx,
    );
    expect(result).toBe(basePlot);
  });

  it('appends fnx with computed expression, cycled color, none legend', () => {
    const result = applyStraightLine(
      basePlot,
      [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ],
      ctx,
    );
    expect(result.fnx.length).toBe(1);
    expect(result.fnx[0]).toEqual({
      fnx: 'x+1',
      color: nextColor(0),
      legendPosition: 'none',
      lineStyle: 'solid',
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: import error for `applyStraightLine`.

- [ ] **Step 3: Add `applyStraightLine`**

Below `applyLine`:

```ts
export function applyStraightLine(model: Plot, points: ReadonlyArray<{ x: number; y: number }>, _ctx: ApplyContext): Plot {
  if (points.length < 2) return model;
  const fnxString = calculateStraightLineFunction(points[0], points[1]);
  if (fnxString === null) return model;
  return {
    ...model,
    fnx: [
      ...model.fnx,
      {
        fnx: fnxString,
        color: nextColor(model.fnx.length),
        legendPosition: 'none',
        lineStyle: 'solid',
      },
    ],
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 3 new specs pass; total 29.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts projects/addin/src/app/components/plot-editor/plot-editor.store.spec.ts
git commit -m "test(addin): add applyStraightLine strategy"
```

---

## Phase 3: Wire Strategies Into Store

### Task 9: Add `INTERACTIVE_STRATEGIES` and simplify `previewModel`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (after `applyStraightLine`; replace `previewModel` body)

- [ ] **Step 1: Add `INTERACTIVE_STRATEGIES` table**

Below `applyStraightLine`:

```ts
export const INTERACTIVE_STRATEGIES: Record<Exclude<InteractiveMode, InteractiveMode.Off>, InteractiveStrategy> = {
  [InteractiveMode.Area]: { minPoints: 3, apply: applyArea },
  [InteractiveMode.Marker]: { minPoints: 1, apply: applyMarker },
  [InteractiveMode.Line]: { minPoints: 2, autoFinishAt: 2, apply: applyLine },
  [InteractiveMode.StraightLine]: { minPoints: 2, autoFinishAt: 2, apply: applyStraightLine },
};
```

- [ ] **Step 2: Replace `previewModel` body**

In `plot-editor.store.ts`, find the `previewModel: computed<Plot>(() => { ... })` block (currently lines 204–277). Replace its body with:

```ts
previewModel: computed<Plot>(() => {
  const model = store.model();
  const mode = store.interactiveMode();
  if (mode === InteractiveMode.Off) return model;
  return INTERACTIVE_STRATEGIES[mode].apply(
    model,
    store.interactivePoints(),
    {
      scheme: store.plotSettings().markerNamingScheme,
      markerNamingService,
    },
  );
}),
```

The full edit replaces everything from `previewModel: computed<Plot>(() =>` up to and including its closing `}),`.

- [ ] **Step 3: Build to verify type-check**

Run: `npx ng build addin`
Expected: build succeeds; no type errors.

- [ ] **Step 4: Run all tests + start app smoke**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 29 specs still pass.

The user must manually verify in the running app that interactive preview still works (Area, Marker, Line, StraightLine). The agent does not start the dev server.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts
git commit -m "refactor(addin): drive plot-editor previewModel through INTERACTIVE_STRATEGIES"
```

---

### Task 10: Add new generic interactive methods alongside old

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (`withMethods` block)

- [ ] **Step 1: Add the four generic methods**

Inside the `withMethods(store => { ... return { ... }; })` block, add the following four methods (place them next to the existing `startInteractive*` methods; do NOT yet remove the old ones):

```ts
startInteractive(mode: Exclude<InteractiveMode, InteractiveMode.Off>): void {
  patchState(store, { interactiveMode: mode, interactivePoints: [] });
},

cancelInteractive(): void {
  patchState(store, {
    interactiveMode: InteractiveMode.Off,
    interactivePoints: [],
  });
},

finishInteractive(): void {
  const mode = store.interactiveMode();
  if (mode === InteractiveMode.Off) return;
  const strategy = INTERACTIVE_STRATEGIES[mode];
  const points = store.interactivePoints();
  if (points.length >= strategy.minPoints) {
    const ctx: ApplyContext = {
      scheme: store.plotSettings().markerNamingScheme,
      markerNamingService,
    };
    store.model.update(m => strategy.apply(m, points, ctx));
  }
  patchState(store, {
    interactiveMode: InteractiveMode.Off,
    interactivePoints: [],
  });
},
```

- [ ] **Step 2: Replace `onPlotClick` body**

Find the existing `onPlotClick(event: PlotClickEvent): void { ... }` method (currently lines 617–682). Replace its body with:

```ts
onPlotClick(event: PlotClickEvent): void {
  const mode = store.interactiveMode();
  if (mode === InteractiveMode.Off) return;
  const strategy = INTERACTIVE_STRATEGIES[mode];
  const points = [...store.interactivePoints(), event];
  if (strategy.autoFinishAt && points.length >= strategy.autoFinishAt) {
    const ctx: ApplyContext = {
      scheme: store.plotSettings().markerNamingScheme,
      markerNamingService,
    };
    store.model.update(m => strategy.apply(m, points, ctx));
    patchState(store, {
      interactiveMode: InteractiveMode.Off,
      interactivePoints: [],
    });
  } else {
    patchState(store, { interactivePoints: points });
  }
},
```

- [ ] **Step 3: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 4: Run tests**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 29 specs still pass.

- [ ] **Step 5: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts
git commit -m "refactor(addin): add generic interactive methods + strategy-driven onPlotClick"
```

---

### Task 11: Tighten `add*`/`remove*` methods using helpers

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (`withMethods` block — `add*` and `remove*` methods)

- [ ] **Step 1: Replace the five `remove*` methods**

In `withMethods`, locate `removeFx`, `removeMarker`, `removeLine`, `removeArea`, `removeAreaPoint`. Replace them with:

```ts
removeFx(index: number): void {
  store.model.update(m => ({ ...m, fnx: removeAt(m.fnx, index) }));
},

removeMarker(index: number): void {
  store.model.update(m => ({ ...m, markers: removeAt(m.markers, index) }));
},

removeLine(index: number): void {
  store.model.update(m => ({ ...m, lines: removeAt(m.lines, index) }));
},

removeArea(index: number): void {
  store.model.update(m => ({ ...m, areas: removeAt(m.areas, index) }));
},

removeAreaPoint(event: { areaIndex: number; pointIndex: number }): void {
  store.model.update(m => ({
    ...m,
    areas: m.areas.map((area, i) =>
      i === event.areaIndex
        ? { ...area, points: removeAt(area.points, event.pointIndex) }
        : area,
    ),
  }));
},
```

- [ ] **Step 2: Replace `addFx`, `addMarker`, `addLine` to use `nextColor`**

```ts
addFx(): void {
  store.model.update(m => ({
    ...m,
    fnx: [
      ...m.fnx,
      {
        fnx: 'x',
        color: nextColor(m.fnx.length),
        legendPosition: 'none',
        lineStyle: 'solid',
      },
    ],
  }));
},

addMarker(): void {
  const scheme = store.plotSettings().markerNamingScheme;
  store.model.update(m => ({
    ...m,
    markers: [
      ...m.markers,
      {
        x: 0,
        y: 0,
        text: markerNamingService.generateName(m.markers.length, scheme),
      },
    ],
  }));
},

addLine(): void {
  store.model.update(m => ({
    ...m,
    lines: [
      ...m.lines,
      {
        x1: 0, y1: 0, x2: 1, y2: 1,
        color: nextColor(m.lines.length),
        lineStyle: 'solid',
      },
    ],
  }));
},
```

- [ ] **Step 3: Replace `addArea` and `addAreaPoint` to use `nameAreaPoints` and `nextColor`**

```ts
addArea(): void {
  const scheme = store.plotSettings().markerNamingScheme;
  store.model.update(m => {
    const startIndex = getNextLabelIndex(m);
    const rawPoints = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    return {
      ...m,
      areas: [
        ...m.areas,
        {
          points: nameAreaPoints(rawPoints, scheme, markerNamingService, startIndex),
          color: nextColor(m.areas.length),
          showPoints: false,
        },
      ],
    };
  });
},

addAreaPoint(areaIndex: number): void {
  const scheme = store.plotSettings().markerNamingScheme;
  store.model.update(m => {
    const nextIndex = getNextLabelIndex(m);
    const areas = m.areas.map((area, i) =>
      i === areaIndex
        ? {
            ...area,
            points: [
              ...area.points,
              ...nameAreaPoints([{ x: 0, y: 0 }], scheme, markerNamingService, nextIndex),
            ],
          }
        : area,
    );
    return { ...m, areas };
  });
},
```

- [ ] **Step 4: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 5: Run tests**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 29 specs pass.

- [ ] **Step 6: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts
git commit -m "refactor(addin): tighten plot-editor add/remove methods with helpers"
```

---

## Phase 4: Migrate Consumers

### Task 12: Migrate `section-areas.html`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/sections/section-areas/section-areas.html`

- [ ] **Step 1: Replace per-mode store calls**

Apply these exact replacements in `section-areas.html`:

| Line | From                                      | To                                                       |
| ---- | ----------------------------------------- | -------------------------------------------------------- |
| 54   | `(click)="store.startInteractiveArea()"`  | `(click)="store.startInteractive(InteractiveMode.Area)"` |
| 258  | `(click)="store.finishInteractiveArea()"` | `(click)="store.finishInteractive()"`                    |
| 270  | `(click)="store.cancelInteractiveArea()"` | `(click)="store.cancelInteractive()"`                    |
| 284  | `(click)="store.startInteractiveArea()"`  | `(click)="store.startInteractive(InteractiveMode.Area)"` |

(`SectionAreas` already exposes `protected readonly InteractiveMode = InteractiveMode`, so the template reference works as-is.)

- [ ] **Step 2: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/sections/section-areas/section-areas.html
git commit -m "refactor(addin): migrate section-areas to generic interactive store API"
```

---

### Task 13: Migrate `section-markers.html`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/sections/section-markers/section-markers.html`

- [ ] **Step 1: Replace per-mode store calls**

| Line | From                                        | To                                                         |
| ---- | ------------------------------------------- | ---------------------------------------------------------- |
| 77   | `(click)="store.startInteractiveMarker()"`  | `(click)="store.startInteractive(InteractiveMode.Marker)"` |
| 228  | `(click)="store.finishInteractiveMarker()"` | `(click)="store.finishInteractive()"`                      |
| 240  | `(click)="store.cancelInteractiveMarker()"` | `(click)="store.cancelInteractive()"`                      |
| 254  | `(click)="store.startInteractiveMarker()"`  | `(click)="store.startInteractive(InteractiveMode.Marker)"` |

- [ ] **Step 2: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/sections/section-markers/section-markers.html
git commit -m "refactor(addin): migrate section-markers to generic interactive store API"
```

---

### Task 14: Migrate `section-lines.html`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/sections/section-lines/section-lines.html`

- [ ] **Step 1: Replace per-mode store calls**

| Line | From                                      | To                                                       |
| ---- | ----------------------------------------- | -------------------------------------------------------- |
| 70   | `(click)="store.startInteractiveLine()"`  | `(click)="store.startInteractive(InteractiveMode.Line)"` |
| 251  | `(click)="store.cancelInteractiveLine()"` | `(click)="store.cancelInteractive()"`                    |
| 264  | `(click)="store.startInteractiveLine()"`  | `(click)="store.startInteractive(InteractiveMode.Line)"` |

(Line mode has no Finish button; auto-commits at 2 clicks.)

- [ ] **Step 2: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/sections/section-lines/section-lines.html
git commit -m "refactor(addin): migrate section-lines to generic interactive store API"
```

---

### Task 15: Migrate `section-fnx.html`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/sections/section-fnx/section-fnx.html`

- [ ] **Step 1: Replace per-mode store calls**

| Line | From                                              | To                                                               |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------- |
| 56   | `(click)="store.startInteractiveStraightLine()"`  | `(click)="store.startInteractive(InteractiveMode.StraightLine)"` |
| 200  | `(click)="store.cancelInteractiveStraightLine()"` | `(click)="store.cancelInteractive()"`                            |
| 213  | `(click)="store.startInteractiveStraightLine()"`  | `(click)="store.startInteractive(InteractiveMode.StraightLine)"` |

- [ ] **Step 2: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/sections/section-fnx/section-fnx.html
git commit -m "refactor(addin): migrate section-fnx to generic interactive store API"
```

---

### Task 16: Migrate `plot-editor.ts`

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.ts:94`

- [ ] **Step 1: Replace `cancelInteractiveIfActive` call**

Change line 94 from:

```ts
this.store.cancelInteractiveIfActive();
```

to:

```ts
this.store.cancelInteractive();
```

- [ ] **Step 2: Build**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.ts
git commit -m "refactor(addin): use cancelInteractive in plot-editor wrapper"
```

---

## Phase 5: Cleanup

### Task 17: Remove old per-mode interactive methods from store

**Files:**

- Modify: `projects/addin/src/app/components/plot-editor/plot-editor.store.ts` (`withMethods` block)

- [ ] **Step 1: Delete the 11 old methods**

In `withMethods`, delete the following methods entirely (they should now have zero callers):

- `startInteractiveArea`
- `cancelInteractiveArea`
- `finishInteractiveArea`
- `startInteractiveMarker`
- `cancelInteractiveMarker`
- `finishInteractiveMarker`
- `startInteractiveLine`
- `cancelInteractiveLine`
- `startInteractiveStraightLine`
- `cancelInteractiveStraightLine`
- `cancelInteractiveIfActive`

Keep: `startInteractive`, `cancelInteractive`, `finishInteractive`, `onPlotClick`, `removeInteractivePoint`, all `add*`/`remove*`, `autoAdjustLimits`.

- [ ] **Step 2: Build to confirm no remaining callers**

Run: `npx ng build addin`
Expected: build succeeds (any remaining caller would surface as a compile error).

- [ ] **Step 3: Run all tests**

Run: `npx ng test addin --watch=false --include='**/plot-editor.store.spec.ts'`
Expected: 29 specs pass.

- [ ] **Step 4: Commit**

```bash
git add projects/addin/src/app/components/plot-editor/plot-editor.store.ts
git commit -m "refactor(addin): remove obsolete per-mode interactive methods"
```

---

### Task 18: Final verification

**Files:** none

- [ ] **Step 1: Lint the addin project**

Run: `npx ng lint addin`
Expected: no lint errors.

- [ ] **Step 2: Build the addin project**

Run: `npx ng build addin`
Expected: build succeeds.

- [ ] **Step 3: Run the full addin test suite**

Run: `npx ng test addin --watch=false`
Expected: all specs pass.

- [ ] **Step 4: Manual UAT (user only — agent cannot start dev server)**

Hand off to the user with a UAT checklist:

- Open `/plot/editor/new`. Add Fx via "+ button" → default `x` appears. Remove Fx → list shrinks.
- Add Marker manually → default named marker (`P1` or `A`) at (0,0).
- Add Area manually → 3-point area with cycled color.
- Add Line manually → line from (0,0) to (1,1).
- Interactive Area: Start → click 4 points on plot → Finish → area committed with all 4 points labeled, preview matches commit.
- Interactive Area with <3 points → Finish → no area added, mode resets.
- Interactive Marker: Start → click 2 points → Finish → 2 markers added, names continue from existing.
- Interactive Line: Start → click 2 points → auto-commits, mode resets, line visible.
- Interactive StraightLine: Start → click 2 non-vertical points → auto-commits, fnx string appears.
- Interactive StraightLine: Start → click 2 vertical-aligned points → no fnx added (silent), mode resets.
- Cancel-during-interaction (Areas/Markers): Start → click some → Cancel → no commit, mode resets, preview reverts.
- Edit existing plot via `/plot/editor/<id>` → all of the above still work, navigation preserves section.

If any step fails, report the failure and revert the offending task's commit.

---

## Self-Review

**Spec coverage:**

| Spec section                                                                                            | Plan task(s) |
| ------------------------------------------------------------------------------------------------------- | ------------ |
| Top-level pure helpers (`nextColor`, `removeAt`, `nameAreaPoints`)                                      | Tasks 1–3    |
| `calculateStraightLineFunction` exported & tested                                                       | Task 4       |
| `InteractiveStrategy` / `ApplyContext` types                                                            | Task 5       |
| `applyArea`, `applyMarker`, `applyLine`, `applyStraightLine`                                            | Tasks 5–8    |
| `INTERACTIVE_STRATEGIES` table                                                                          | Task 9       |
| Simplified `previewModel` (single source of truth)                                                      | Task 9       |
| New generic store methods (`startInteractive`, `cancelInteractive`, `finishInteractive`, `onPlotClick`) | Task 10      |
| Tightened collection methods (`add*`, `remove*` use helpers)                                            | Task 11      |
| Consumer migrations (4 templates + plot-editor.ts)                                                      | Tasks 12–16  |
| Removal of `cancelInteractiveIfActive` and per-mode methods                                             | Tasks 16–17  |
| Tests for new pure functions                                                                            | Tasks 1–8    |
| Verification (build / lint / manual)                                                                    | Task 18      |

No spec items unaddressed.

**Type consistency:** Helper signatures used in later tasks match those introduced in earlier tasks (`ApplyContext`, `InteractiveStrategy`, helper return types). The strategy table at Task 9 uses `Exclude<InteractiveMode, InteractiveMode.Off>` matching the spec. Generic methods at Task 10 use the same constraint.

**Placeholders:** None.
