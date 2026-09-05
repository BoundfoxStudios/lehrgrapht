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
