---
name: angular-conventions
description: Use for Angular development – components, signals, routing, forms, tests. Contains the Angular conventions of this project.
---

# Angular Conventions

## Fundamentals

- Standalone components, no NgModules
- Never set `standalone: true` in Angular decorators – it has been the
  default since Angular v20
- Prefer signals (`signal`, `computed`, `input()`, `output()`)
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component`
  decorator
- Build forms with Signal Forms, not template-driven or reactive forms;
  always pull the current Signal Forms docs before working with them
  (context7 or angular.dev)
- No `ngSubmit`/`(submit)` on the `form` tag – submit runs through the
  `formRoot` directive
- Load feature routes via lazy loading
- No `@HostBinding` or `@HostListener` decorators – host bindings belong
  in the `host` object of the `@Component` or `@Directive` decorator
- `NgOptimizedImage` for all static images
  - `NgOptimizedImage` does not work for inline base64 images

## Components

- Keep components small and focused on a single responsibility
- `input()` and `output()` functions instead of decorators
- Always external templates (separate `.html` files) and external styles
  (separate `.css` files), never inline templates or styles
- No `ngClass`, use `class` bindings instead
- No `ngStyle`, use `style` bindings instead
- Specify paths to external templates/styles relative to the component's
  TS file

## State Management

- Signals for local component state
- `computed()` for derived state
- Keep state transformations pure and predictable
- No `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`,
  `*ngFor`, `*ngSwitch`
- Handle observables via the async pipe
- Do not assume that globals like `new Date()` are available
- Do not write arrow functions in templates (they are not supported)
- For buttons (`<button>`) and anchor buttons (`<a [routerLink]>`), use the
  `lgButton` directive
  (`projects/addin/src/app/ui/button/button.directive.ts`) with the
  appropriate `variant`, `size` and `iconOnly` inputs. Do not write ad-hoc
  Tailwind button styles. If no existing variant fits, extend the directive
  instead of bypassing it.
- For text/number inputs, use the `lg-input` component
  (`projects/addin/src/app/ui/input/input.ts`) wherever possible. Only fall
  back to a raw `<input>` when `lg-input` genuinely cannot fulfill the
  requirement.
- For animating a `faIcon`, use the FontAwesome `animation` input (e.g.
  `animation="spin"`). No Tailwind `animate-spin` on a `faIcon`.

## Services

- Design services around a single responsibility
- `providedIn: 'root'` for singleton services
- `inject()` function instead of constructor injection
