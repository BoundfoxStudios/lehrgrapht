# Model Migration Skill

## Rule

Any change to the `Plot` interface or its related types (`MathFunction`, `PlotRange`, `AreaPoint`, `LabelPosition`, etc.) in `projects/addin/src/app/models/plot.ts` **must** be accompanied by a migration.

## What You Must Do

1. **If `models/migrations/migrate-to-latest.ts` exists:** Update the migration function to also handle the new field changes.
2. **If `models/migrations/migrate-to-latest.ts` does not exist:** Create it with a new migration function and register it in `models/migration.ts`.
3. **Add tests** in `models/migration.spec.ts` that verify the migration correctly handles both missing fields (backfilled with defaults) and existing fields (preserved). Every new or changed field must have test coverage.

Each migration file exports a `Migration` object:

```typescript
import { Migration } from '../migration';

export const migrateToLatest: Migration = {
  version: 'latest',
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    return {
      ...plot,
      newField: plot['newField'] ?? 'default value',
    };
  },
};
```

Register it in `models/migration.ts` by importing and adding it to the `migrations` array.

## Architecture

- **Sequential pipeline:** Migrations run in version order. Each transforms from version N to N+1. `migrate-to-latest.ts` always runs last.
- **Untyped input/output:** Migration functions use `Record<string, unknown>` since the input shape is by definition not the current `Plot` type.
- **Centralized execution:** `DocumentStorageService.getPlot()` delegates to `MigrationService.migrate()` on load and writes back the migrated data automatically.
- **Version stamping:** `DocumentStorageService.setPlot()` stamps the current `lehrgraphtVersion` on every save.

## Version Handling

- `"0.0.0"` is the dev version (`lehrgraphtVersion` during development). It is treated as "always latest" — plots with this version are never migrated.
- Plots without a `version` field are assumed to be `"1.4.1"` (last release before the migration system).
- The `version` field in `Plot` is stamped with `lehrgraphtVersion` on every save.

## Release Workflow

1. **During development:** Model changes accumulate in `migrate-to-latest.ts`.
2. **Release happens:** The version is tagged (e.g. `1.5.0`). The released code ships with `migrate-to-latest.ts`.
3. **After release:** Rename `migrate-to-latest.ts` to `migrate-to-<released-version>.ts`. Update its `version` field from `'latest'` to the released version string. Update the import and registration in `migration.ts`.
4. **Next model change:** Create a new `migrate-to-latest.ts`.

The presence of `migrate-to-latest.ts` signals unreleased model changes. Its absence means no pending migration.

## Testing

Tests live in `projects/addin/src/app/models/migration.spec.ts`. Run with `npx ng test addin --no-watch`.

For each migrated field, write two tests:

- **Backfill test:** Input without the field results in the correct default value.
- **Preserve test:** Input with an existing value keeps that value unchanged.

## Key Files

- `projects/addin/src/app/models/plot.ts` — The Plot interface and related types
- `projects/addin/src/app/models/migration.ts` — `MigrationService`, types, and registry
- `projects/addin/src/app/models/migrations/` — Migration scripts
- `projects/addin/src/app/services/document-storage.service.ts` — `getPlot()`/`setPlot()` with migration integration
- `projects/addin/src/version.ts` — `lehrgraphtVersion` constant
