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

    const lines =
      (plot['lines'] as Record<string, unknown>[] | undefined) ?? [];

    const migratedLines: Record<string, unknown>[] = lines.map(line => ({
      ...line,
      lineStyle: line['lineStyle'] ?? 'solid',
    }));

    const areas =
      (plot['areas'] as Record<string, unknown>[] | undefined) ?? [];

    const polygonsFromLines = migratedLines.map(line => ({
      points: [
        {
          x: line['x1'],
          y: line['y1'],
          labelPosition: 'auto',
          labelText: '',
        },
        {
          x: line['x2'],
          y: line['y2'],
          labelPosition: 'auto',
          labelText: '',
        },
      ],
      connect: false,
      lineColor: line['color'],
      fillColor: null,
      lineStyle: line['lineStyle'],
      showPoints: false,
    }));

    const polygonsFromAreas = areas.map(area => {
      const points =
        (area['points'] as Record<string, unknown>[] | undefined) ?? [];
      return {
        points: points.map(p => ({
          x: p['x'],
          y: p['y'],
          labelPosition: p['labelPosition'] ?? 'auto',
          labelText: p['labelText'] ?? '',
        })),
        connect: true,
        lineColor: '#000000',
        fillColor: area['color'],
        lineStyle: 'solid',
        showPoints: area['showPoints'] ?? false,
      };
    });

    return {
      ...plot,
      fnx: migratedFnx,
      lines: migratedLines,
      legendLabelFormat: plot['legendLabelFormat'] ?? 'none',
      polygons: [...polygonsFromLines, ...polygonsFromAreas],
    };
  },
};
