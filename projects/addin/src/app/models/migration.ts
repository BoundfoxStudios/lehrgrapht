import { Injectable } from '@angular/core';
import { Plot } from './plot';
import { lehrgraphtVersion } from '../../version';
import { migrateTo141 } from './migrations/migrate-to-1.4.1';
import { migrateToLatest } from './migrations/migrate-to-latest';

export type MigrationFn = (
  plot: Record<string, unknown>,
) => Record<string, unknown>;

export interface Migration {
  version: string;
  migrate: MigrationFn;
}

const PRE_MIGRATION_VERSION = '1.4.1';
const LATEST_TOKEN = 'latest';
const DEV_VERSION = '0.0.0';

/**
 * All registered migrations, ordered by version.
 * Migrations with version "latest" are applied last.
 */
const migrations: Migration[] = [migrateTo141, migrateToLatest];

export interface MigrationResult {
  plot: Plot;
  wasMigrated: boolean;
}

@Injectable({ providedIn: 'root' })
export class MigrationService {
  migrate(raw: Record<string, unknown>): MigrationResult {
    const version =
      (raw['version'] as string | undefined) ?? PRE_MIGRATION_VERSION;

    if (version === DEV_VERSION) {
      return { plot: raw as unknown as Plot, wasMigrated: false };
    }

    const versioned = migrations.filter(m => m.version !== LATEST_TOKEN);
    const latest = migrations.filter(m => m.version === LATEST_TOKEN);

    const applicable = versioned.filter(
      m => compareSemver(m.version, version) > 0,
    );
    applicable.sort((a, b) => compareSemver(a.version, b.version));

    const allApplicable = [...applicable, ...latest];

    if (allApplicable.length === 0) {
      return { plot: raw as unknown as Plot, wasMigrated: false };
    }

    let result = raw;
    for (const migration of allApplicable) {
      result = migration.migrate(result);
    }

    result['version'] = lehrgraphtVersion;

    return { plot: result as unknown as Plot, wasMigrated: true };
  }
}

function compareSemver(a: string, b: string): number {
  if (a === DEV_VERSION) return 1;
  if (b === DEV_VERSION) return -1;

  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
}
