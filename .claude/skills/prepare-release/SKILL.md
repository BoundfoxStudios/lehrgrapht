---
name: prepare-release
description: Use when preparing a new release version - bumps package version, renames and updates migration files
---

# Prepare Release

Prepares the codebase for a new version release. The user provides the new version number.

## Input

The new version number (e.g., `1.5.0`).

## Steps

### 1. Determine previous version

Read the current `version` from `package.json`. This is the **previous version** used for renaming migration files.

### 2. Bump version in package.json and package-lock.json

```bash
npm version <new-version> --no-git-tag-version
```

This updates both `package.json` and `package-lock.json` atomically.

### 3. Rename migration files (only if migrate-to-latest.ts exists)

If `projects/addin/src/app/models/migrations/migrate-to-latest.ts` does not exist, skip to step 7.

Use `git mv` to preserve history:

```bash
git mv projects/addin/src/app/models/migrations/migrate-to-latest.ts projects/addin/src/app/models/migrations/migrate-to-<previous-version>.ts
git mv projects/addin/src/app/models/migrations/migrate-to-latest.spec.ts projects/addin/src/app/models/migrations/migrate-to-<previous-version>.spec.ts
```

### 4. Update the renamed migration file

In `migrate-to-<previous-version>.ts`, make two changes:

- Change `version: 'latest'` to `version: '<previous-version>'`
- Rename the export: `migrateToLatest` → `migrateTo<VersionDigits>`

**Export naming convention:** Remove dots from the version. Examples:

- `1.4.1` → `migrateTo141`
- `2.0.0` → `migrateTo200`
- `1.12.3` → `migrateTo1123`

### 5. Update the renamed spec file

In `migrate-to-<previous-version>.spec.ts`:

- Update the import path and name to match the renamed file and export
- Update the `describe` block name to `migrate-to-<previous-version>`
- Update the variable reference from `migrateToLatest` to the new export name

### 6. Update migration.ts

In `projects/addin/src/app/models/migration.ts`:

- Update the import to use the new filename and export name
- Update the `migrations` array to use the new export name

**Do NOT** create new empty `migrate-to-latest.ts` or `migrate-to-latest.spec.ts` files. The absence of `migrate-to-latest.ts` signals no pending migrations (see migrations skill).

### 7. Verify

Run tests to confirm nothing is broken:

```bash
npx ng test addin --no-watch
```

## Quick Reference

| Step | Action                                   | Files                                    |
| ---- | ---------------------------------------- | ---------------------------------------- |
| 1    | Read previous version                    | `package.json`                           |
| 2    | `npm version <new> --no-git-tag-version` | `package.json`, `package-lock.json`      |
| 3    | `git mv` migration files                 | `migrations/migrate-to-latest.ts` + spec |
| 4    | Update version + export name             | `migrations/migrate-to-<prev>.ts`        |
| 5    | Update import + describe + variable      | `migrations/migrate-to-<prev>.spec.ts`   |
| 6    | Update import + array                    | `migration.ts`                           |
| 7    | Run tests                                | —                                        |

## Common Mistakes

- **Creating new empty migrate-to-latest files** — Do NOT. Its absence is intentional and signals no unreleased model changes.
- **Forgetting to update migration.ts** — The import path, import name, and migrations array all need updating.
- **Editing package-lock.json manually** — Use `npm version` instead; it handles both files.
