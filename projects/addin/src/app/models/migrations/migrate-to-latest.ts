import { Migration } from '../migration';

export const migrateToLatest: Migration = {
  version: 'latest',
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    const areas = plot['areas'] as Record<string, unknown>[] | undefined;

    const migratedAreas = (areas ?? []).map(area => {
      const points = area['points'] as Record<string, unknown>[] | undefined;

      return {
        ...area,
        showPoints: area['showPoints'] ?? false,
        points: (points ?? []).map(point => ({
          ...point,
          labelPosition: point['labelPosition'] ?? 'auto',
          labelText: point['labelText'] ?? '',
        })),
      };
    });

    return {
      ...plot,
      areas: migratedAreas,
      axisLabelX: plot['axisLabelX'] ?? 'x',
      axisLabelY: plot['axisLabelY'] ?? 'y',
    };
  },
};
