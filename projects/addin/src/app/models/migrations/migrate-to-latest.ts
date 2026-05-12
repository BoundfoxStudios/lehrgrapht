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

    const areas =
      (plot['areas'] as Record<string, unknown>[] | undefined) ?? [];

    const polygonsFromLines = lines.map(line => ({
      points: [
        { x: line['x1'], y: line['y1'], labelPosition: 'auto', labelText: '' },
        { x: line['x2'], y: line['y2'], labelPosition: 'auto', labelText: '' },
      ],
      connect: false,
      lineColor: line['color'],
      fillColor: null,
      lineStyle: line['lineStyle'] ?? 'solid',
      showPoints: false,
      fillStyle: 'solid',
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
        fillStyle: 'solid',
      };
    });

    const existingPolygons =
      (plot['polygons'] as Record<string, unknown>[] | undefined) ?? [];
    const migratedExistingPolygons = existingPolygons.map(p => ({
      ...p,
      fillStyle: p['fillStyle'] ?? 'solid',
    }));

    const result: Record<string, unknown> = {
      ...plot,
      fnx: migratedFnx,
      legendLabelFormat: plot['legendLabelFormat'] ?? 'none',
      showAxisArrows: plot['showAxisArrows'] ?? false,
      gridStep: plot['gridStep'] ?? '1',
      polygons: [
        ...migratedExistingPolygons,
        ...polygonsFromLines,
        ...polygonsFromAreas,
      ],
    };

    delete result['lines'];
    delete result['areas'];

    return result;
  },
};
