import { Migration } from '../migration';
import { lehrgraphtVersion } from '../../../version';

export const migrateToLatest: Migration = {
  version: lehrgraphtVersion,
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    const fnx = plot['fnx'] as Record<string, unknown>[] | undefined;

    const migratedFnx = (fnx ?? []).map(fn => ({
      ...fn,
      legendPosition: fn['legendPosition'] ?? 'none',
    }));

    return {
      ...plot,
      fnx: migratedFnx,
    };
  },
};
