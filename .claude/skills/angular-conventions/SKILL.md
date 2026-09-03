---
name: angular-conventions
description: Bei Angular-Entwicklung nutzen – Komponenten, Signals, Routing, Forms, Tests. Enthält die Angular-Konventionen dieses Projekts.
---

# Angular-Konventionen

## Grundlagen

- Standalone Components, keine NgModules
- `standalone: true` niemals in Angular-Decorators setzen – seit Angular v20
  ist das der Standard
- Signals bevorzugen (`signal`, `computed`, `input()`, `output()`)
- `changeDetection: ChangeDetectionStrategy.OnPush` im `@Component`-Decorator
  setzen
- Formulare mit Signal Forms, keine Template-driven oder Reactive Forms;
  vor der Arbeit damit immer die aktuelle Signal-Forms-Doku ziehen
  (context7 bzw. angular.dev)
- Kein `ngSubmit`/`(submit)` auf dem `form`-Tag – Submit läuft über die
  `formRoot`-Directive
- Feature-Routen per Lazy Loading laden
- Keine `@HostBinding`- und `@HostListener`-Decorators – Host-Bindings
  gehören in das `host`-Objekt des `@Component`- bzw. `@Directive`-Decorators
- `NgOptimizedImage` für alle statischen Bilder
  - `NgOptimizedImage` funktioniert nicht für Inline-base64-Bilder

## Komponenten

- Komponenten klein halten und auf eine einzige Verantwortung fokussieren
- `input()`- und `output()`-Funktionen statt Decorators
- Immer externe Templates (eigene `.html`-Dateien) und externe Styles
  (eigene `.css`-Dateien), nie Inline-Templates oder -Styles
- Kein `ngClass`, stattdessen `class`-Bindings
- Kein `ngStyle`, stattdessen `style`-Bindings
- Pfade zu externen Templates/Styles relativ zur TS-Datei der Komponente
  angeben

## State Management

- Signals für lokalen Komponenten-State
- `computed()` für abgeleiteten State
- State-Transformationen pur und vorhersagbar halten
- Kein `mutate` auf Signals, stattdessen `update` oder `set`

## Templates

- Templates einfach halten und komplexe Logik vermeiden
- Native Control Flow (`@if`, `@for`, `@switch`) statt `*ngIf`, `*ngFor`,
  `*ngSwitch`
- Observables über die async-Pipe verarbeiten
- Nicht davon ausgehen, dass Globals wie `new Date()` verfügbar sind
- Keine Arrow Functions in Templates schreiben (werden nicht unterstützt)
- Für Buttons (`<button>`) und Anchor-Buttons (`<a [routerLink]>`) die
  `lgButton`-Directive
  (`projects/addin/src/app/ui/button/button.directive.ts`) mit den passenden
  Inputs `variant`, `size` und `iconOnly` verwenden. Keine
  Ad-hoc-Tailwind-Button-Styles schreiben. Passt keine bestehende Variante,
  die Directive erweitern statt sie zu umgehen.
- Für Text-/Zahlen-Inputs wo immer möglich die `lg-input`-Komponente
  (`projects/addin/src/app/ui/input/input.ts`) verwenden. Auf ein rohes
  `<input>` nur ausweichen, wenn `lg-input` die Anforderung wirklich nicht
  erfüllen kann.
- Für die Animation eines `faIcon` den FontAwesome-Input `animation`
  verwenden (z.B. `animation="spin"`). Kein Tailwind-`animate-spin` auf einem
  `faIcon`.

## Services

- Services um eine einzige Verantwortung herum entwerfen
- `providedIn: 'root'` für Singleton-Services
- `inject()`-Funktion statt Constructor Injection
