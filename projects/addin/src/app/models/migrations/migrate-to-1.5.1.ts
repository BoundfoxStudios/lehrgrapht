import { Migration } from '../migration';

export const migrateTo151: Migration = {
  version: '1.5.1',
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    const fnx = plot['fnx'] as Record<string, unknown>[] | undefined;

    const migratedFnx = (fnx ?? []).map(fn => ({
      ...fn,
      showLegend: fn['showLegend'] ?? false,
    }));

    return {
      ...plot,
      fnx: migratedFnx,
      showLegend: plot['showLegend'] ?? false,
    };
  },
};
