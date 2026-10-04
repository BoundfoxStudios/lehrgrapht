@general-conventions.md

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular

- All Angular conventions live in the `angular-conventions` skill (`.claude/skills/angular-conventions/SKILL.md`). Load it before any Angular work.

## Math Engine

- All mathjs usage goes through the shared instance in `projects/addin/src/app/utils/math.ts` (own `create(all)` instance that adds `ln` and `lg`). Never call functions or use classes from the `mathjs` package directly in app code: node classes are instance-specific, so `instanceof` against `mathjs` exports is false for nodes parsed by our instance. Type-only imports from `mathjs` are fine. ESLint enforces this via `no-restricted-imports`.

## Plot Rendering

- The plotly types ship with `plotly.js-dist-min` itself (since 4.1.0). Do not add `@types/plotly.js-dist-min` back: it is still on npm, but it describes the old `@types/plotly.js` surface, whose names differ: `Annotations`, `PlotData` and `Plotly.Image` do not exist, use the named type imports `Annotation`, `ScatterData` and `LayoutImage`. Coordinate attributes such as `Annotation.x`, `Shape.x0` or `LayoutImage.x` are typed `any`, so annotations go through `PlotAnnotation` (`services/plot/render-space.ts`), which narrows `x` and `y` to `number | string` for the strict lint rules.
- A shape with a paper-referenced end (`xref: 'paper'` or `yref: 'paper'`) lands in the lower shape layer for every `layer` value except `'above'`, below the grid lines and the plot frame, which then draw over it. `'between'`, drawn between the grid and the traces where the zero line sits, does not help either, because the paper check runs first. Axis lines therefore use `'above'` (`services/plot/axis-lines.ts`).
- The preview converts pointer positions with the margin `PlotService.generate` returns as `marginMm`, never with a constant: a function legend at the start or end widens `layout.margin` on that side only (`plot-size.service.ts`), which put the placed point up to three squares off (issue #59). The conversion is the pure `previewPointToPlotCoordinates` in `services/plot/preview-coordinates.ts`; it returns null outside the plot area, so a pointer anywhere in the margin places no point and shows no readout. While an interactive mode is active, the preview additionally drops all function legends (`withoutFunctionLegends` in `plot-editor.store.ts`); that is a UX choice so the equations stop covering the curve ends being clicked, not what makes the coordinates correct.

## Reflection

- An axis reflection is only a reflection when both axes use the same units per square, so it is locked whenever they differ. The rule lives in `services/plot/reflection.ts` (`isAxisReflectionAllowed`, and `hasAxisReflectionScaleConflict` for the combination); a form validator in `plot-editor.store.ts` blocks saving and, like every form error, freezes the editor preview (see Axis Limits); the reflection and display sections explain it. Point reflection is unaffected. Do not "fix" this by reflecting in render space: that changes the numbers, which was rejected in issue #57.
- The reflection validator reads `valueOf(schema)` and drills into the result instead of `valueOf(schema.unitsPerSquare)`: a dev-build plot (version 0.0.0) skips every migration, so the key can be missing and Signal Forms throws NG01901 on the unresolvable child path.

## Axis Limits

- An emptied `<input type="number">` makes Signal Forms write `null` into the model, although `PlotRange` types the limits as `number`. A lone `-` or `1e` is a parse error (`kind: 'parse'`, no message) that leaves the model unchanged; `lg-input` then shows only its own text, because the other errors of that field refer to the stale model value. Match on `error.kind`: `FormField` spreads parse errors into plain objects, so `instanceof NativeInputParseError` is always false.
- `PlotService.generate` cannot draw every model the form can hold: a `null` limit makes `math.range` throw, and an inverted y range throws in `math.min([])` (issue #16). The form validators keep such models away from it: `required()` on all four limits, and `lessThanValidator` only compares finite numbers, so an emptied limit reports `required` alone. A new state `generate` cannot draw gets a validator, not a guard in `generate`. Very large finite ranges are not limited yet.
- The editor preview follows the model only while `hasErrors` is false (parse errors included). Otherwise `previewModel` keeps the last error-free preview by reference, so nothing regenerates, and the section dock overlays a hint; the hub keeps its error dock. `previewModel` is keyed on `activeId` so a frozen preview never carries over to another plot, and the dock drops the polygon highlight while frozen, because the hovered index refers to the current polygon list. Interactive mode cannot start and ignores clicks while the form has errors.
- `PlotPreview` and `PlotMiniPreview` catch a failing `generate` per emission inside the `switchMap` and report it to `ErrorHandler`: one rejection used to end the stream and freeze the preview for good. This is a backstop, not the validation.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow the visual WCAG AA minimums, including focus management and color contrast.
- Screen readers are not a target for LehrGrapht: do not add `aria-invalid`, `aria-describedby`, live regions or other markup that only serves screen readers.

## Git

- Make small, independent commits — each commit should represent a single logical change
- Do NOT bundle unrelated changes into one commit

## Issues & Pull Requests

- Issues and pull request descriptions are written in German. Pull request titles and commit messages stay in English.

## Local Workflow

- NEVER start the app or dev server (e.g., `ng serve`, `npm start`). The user runs the app themselves.
- You MAY build (`ng build`) and lint (`ng lint`) for verification.

## Critical Constraints

- Changes to `projects/addin/src/app/services/plot/plot.service.ts` MUST NOT alter the `scaleanchor` configuration in any way. It is required for correct 5×5 mm grid rendering.
