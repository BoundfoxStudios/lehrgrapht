---
name: prepare-release
description: Use when preparing a new release version - bumps package version, renames and updates migration files
---

# Prepare Release

Prepares the codebase for a new version release. The new version number is computed automatically from conventional commits; the user confirms or overrides it.

## Input

None required. The user may provide an explicit version number to override the computed one (e.g., to force a major bump).

## Steps

### 1. Determine previous and new version

Read the current `version` from `package.json`. This is the **previous version**, used later to scope the changelog (Step 7) — not for renaming migration files.

Compute the proposed **new version** from the conventional commits since the last tag:

```bash
npm run version:next
```

Show the user the proposed version together with the commits driving it:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Ask the user to confirm or override before proceeding.

**Guard:** If the computed version equals the previous version from `package.json`, stop and clarify with the user. Possible causes:

- There is nothing release-worthy since the last tag (only commits whose type does not bump, e.g. `build`, `ci`, `docs` — see `cliff.toml`).
- The release was already prepared but not yet merged and tagged (`package.json` already bumped).
- The last release tag is missing or not reachable from this branch (tags must sit on develop-side commits, see the `release.yml` workflow).

### 2. Bump version in package.json and package-lock.json

```bash
npm version <new-version> --no-git-tag-version
```

This updates both `package.json` and `package-lock.json` atomically.

### 3. Rename migration files (only if migrate-to-latest.ts exists)

If `projects/addin/src/app/models/migrations/migrate-to-latest.ts` does not exist, skip to step 7 (changelog).

Use `git mv` to preserve history. **Rename to the new version**, because the migration brings plot data _to_ that version (see `version:` property in the file and the comparison in `migration.ts`):

```bash
git mv projects/addin/src/app/models/migrations/migrate-to-latest.ts projects/addin/src/app/models/migrations/migrate-to-<new-version>.ts
git mv projects/addin/src/app/models/migrations/migrate-to-latest.spec.ts projects/addin/src/app/models/migrations/migrate-to-<new-version>.spec.ts
```

### 4. Update the renamed migration file

In `migrate-to-<new-version>.ts`, make two changes:

- Change `version: 'latest'` to `version: '<new-version>'`
- Rename the export: `migrateToLatest` → `migrateTo<VersionDigits>` (digits of the new version)

**Export naming convention:** Remove dots from the version. Examples:

- `1.4.1` → `migrateTo141`
- `2.0.0` → `migrateTo200`
- `1.12.3` → `migrateTo1123`

### 5. Update the renamed spec file

In `migrate-to-<new-version>.spec.ts`:

- Update the import path and name to match the renamed file and export
- Update the `describe` block name to `migrate-to-<new-version>`
- Update the variable reference from `migrateToLatest` to the new export name

### 6. Update migration.ts

In `projects/addin/src/app/models/migration.ts`:

- Update the import to use the new filename and export name
- Update the `migrations` array to use the new export name

**Do NOT** create new empty `migrate-to-latest.ts` or `migrate-to-latest.spec.ts` files. The absence of `migrate-to-latest.ts` signals no pending migrations (see migrations skill).

### 7. Update changelog

Add a new entry at the **top** of the `changelogData` array in `projects/shared/src/lib/changelog-data.ts`:

```typescript
{
  version: '<new-version>',
  changes: [
    // user-facing changes only, in German
  ],
},
```

**Only include user-facing changes.** Review the git log since the previous version to identify them. Exclude pure technical changes (refactors, build config, dependency updates, test fixes, CI changes). The entries are written in German.

Ask the user to confirm or adjust the changelog entries before proceeding.

### 8. Verify

Run tests to confirm nothing is broken:

```bash
npx ng test addin --no-watch
```

### 9. Hand-off

Remind the user to merge `develop` into `main` promptly after the prepare commit lands. The `release.yml` workflow tags develop's head at merge time — commits landing on `develop` between the prepare commit and the merge would ship in the release unreviewed and be excluded from all future version calculations.

## Quick Reference

| Step | Action                                                                         | Files                                    |
| ---- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| 1    | Read previous version, compute new one (`npm run version:next`), user confirms | `package.json`                           |
| 2    | `npm version <new> --no-git-tag-version`                                       | `package.json`, `package-lock.json`      |
| 3    | `git mv` migration files                                                       | `migrations/migrate-to-latest.ts` + spec |
| 4    | Update version + export name                                                   | `migrations/migrate-to-<new>.ts`         |
| 5    | Update import + describe + variable                                            | `migrations/migrate-to-<new>.spec.ts`    |
| 6    | Update import + array                                                          | `migration.ts`                           |
| 7    | Update changelog (user-facing only)                                            | `shared/src/lib/changelog-data.ts`       |
| 8    | Run tests                                                                      | —                                        |
| 9    | Remind user to merge develop → main promptly                                   | —                                        |

## Common Mistakes

- **Skipping the version confirmation** — Always show the user the computed version and the driving commits before bumping. A misplaced or missing tag silently produces a wrong version.
- **Renaming `migrate-to-latest` after the previous version** — Use the NEW version. `migrate-to-X.ts` means "migrates plot data to version X"; the file carries `version: 'X'` and `migration.ts` applies it when stored data is older than X.
- **Creating new empty migrate-to-latest files** — Do NOT. Its absence is intentional and signals no unreleased model changes.
- **Forgetting to update migration.ts** — The import path, import name, and migrations array all need updating.
- **Editing package-lock.json manually** — Use `npm version` instead; it handles both files.
- **Including technical changes in changelog** — Only user-facing changes. No refactors, build config, dependency updates, or CI changes.
