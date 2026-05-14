import { Migration } from '../migration';

export const migrateTo150: Migration = {
  version: '1.5.0',
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
      isSolution: false,
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
        isSolution: false,
      };
    });

    const existingPolygons =
      (plot['polygons'] as Record<string, unknown>[] | undefined) ?? [];
    const migratedExistingPolygons = existingPolygons.map(p => ({
      ...p,
      fillStyle: p['fillStyle'] ?? 'solid',
      isSolution: p['isSolution'] ?? false,
    }));

    const existingReflection = plot['reflection'] as
      | Record<string, unknown>
      | undefined;
    const buildReflection = (): Record<string, unknown> => {
      if (!existingReflection || existingReflection['kind'] === 'none') {
        return { kind: 'none' };
      }
      if (existingReflection['kind'] === 'point') {
        return {
          ...existingReflection,
          isSolution: existingReflection['isSolution'] ?? false,
        };
      }
      if (existingReflection['kind'] === 'axis') {
        return {
          ...existingReflection,
          isSolution: existingReflection['isSolution'] ?? false,
          color: existingReflection['color'] ?? '#ff0000',
          lineStyle: existingReflection['lineStyle'] ?? 'solid',
          extendBeyondPoints: existingReflection['extendBeyondPoints'] ?? false,
        };
      }
      return { kind: 'none' };
    };
    const migratedReflection = buildReflection();

    const result: Record<string, unknown> = {
      ...plot,
      fnx: migratedFnx,
      legendLabelFormat: plot['legendLabelFormat'] ?? 'none',
      showAxisArrows: plot['showAxisArrows'] ?? false,
      gridStep: plot['gridStep'] ?? '1',
      reflection: migratedReflection,
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
