import { Migration } from '../migration';
import { lehrgraphtVersion } from '../../../version';

export const migrateToLatest: Migration = {
  version: lehrgraphtVersion,
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    const fnx = plot['fnx'] as Record<string, unknown>[] | undefined;

    const migratedFnx = (fnx ?? []).map(fn => ({
      ...fn,
      legendPosition: fn['legendPosition'] ?? 'none',
      lineStyle: fn['lineStyle'] ?? 'solid',
    }));

    const lines = plot['lines'] as Record<string, unknown>[] | undefined;

    const migratedLines = (lines ?? []).map(line => ({
      ...line,
      lineStyle: line['lineStyle'] ?? 'solid',
    }));

    return {
      ...plot,
      fnx: migratedFnx,
      lines: migratedLines,
      legendLabelFormat: plot['legendLabelFormat'] ?? 'none',
    };
  },
};
