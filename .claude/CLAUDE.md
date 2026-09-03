@general-conventions.md

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular

- All Angular conventions live in the `angular-conventions` skill (`.claude/skills/angular-conventions/SKILL.md`). Load it before any Angular work.

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
