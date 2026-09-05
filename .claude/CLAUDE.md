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

- `@types/plotly.js` is a major version behind the runtime (`plotly.js-dist-min` 4.0.0), so the runtime accepts attribute values the types reject. `layout.shapes[].layer` is one: Plotly 4 also takes `'between'`, drawn between the grid and the traces where the zero line sits, while the typings only know `'below' | 'above'`.
- A shape with a paper-referenced end (`xref: 'paper'` or `yref: 'paper'`) lands in the lower shape layer for every `layer` value except `'above'`, below the grid lines and the plot frame, which then draw over it. `'between'` does not help either, because the paper check runs first. Axis lines therefore use `'above'` (`services/plot/axis-lines.ts`).
- Switching to the `plotly.js` package for its own bundled types was evaluated and rejected (2026-09). A full import fails the Angular build because esbuild cannot resolve the `stream` and `assert` builtins, and the `plotly.js/lib/core` partial ships no types of its own in 4.0.0, so the switch costs two test suites that stop loading, seven lint errors and seven `as unknown as` casts. It also buys nothing here: the `'between'` layer value it unlocks is the wrong one for a paper-referenced shape, see above. Revisit once a release past 4.0.0 ships the fixes already merged to `main` (plotly/plotly.js#8000 compiles the TypeScript at packaging time, #8001 puts the type definitions into the dist bundles); the switch then shrinks to a version bump plus dropping `@types/plotly.js-dist-min`, and this note goes away.

## Reflection

- An axis reflection is only a reflection when both axes use the same units per square, so it is locked whenever they differ. The rule lives in `services/plot/reflection.ts` (`isAxisReflectionAllowed`, and `hasAxisReflectionScaleConflict` for the combination); a form validator in `plot-editor.store.ts` blocks saving and the reflection and display sections explain it. Point reflection is unaffected. Do not "fix" this by reflecting in render space: that changes the numbers, which was rejected in issue #57.
- The reflection validator reads `valueOf(schema)` and drills into the result instead of `valueOf(schema.unitsPerSquare)`: a dev-build plot (version 0.0.0) skips every migration, so the key can be missing and Signal Forms throws NG01901 on the unresolvable child path.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

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
