import { migrateToLatest } from './migrate-to-latest';

describe('migrate-to-latest', () => {
  const migrate = migrateToLatest.migrate;

  it('should backfill fnx legendPosition', () => {
    const result = migrate({ fnx: [{ fnx: 'x', color: '#000' }] });

    const fnx = result['fnx'] as Record<string, unknown>[];
    expect(fnx[0]['legendPosition']).toBe('none');
  });

  it('should preserve existing fnx legendPosition', () => {
    const result = migrate({
      fnx: [{ fnx: 'x', color: '#000', legendPosition: 'end' }],
    });

    const fnx = result['fnx'] as Record<string, unknown>[];
    expect(fnx[0]['legendPosition']).toBe('end');
  });

  it('should backfill fnx lineStyle to solid', () => {
    const result = migrate({ fnx: [{ fnx: 'x', color: '#000' }] });

    const fnx = result['fnx'] as Record<string, unknown>[];
    expect(fnx[0]['lineStyle']).toBe('solid');
  });

  it('should preserve existing fnx lineStyle', () => {
    const result = migrate({
      fnx: [{ fnx: 'x', color: '#000', lineStyle: 'dashed' }],
    });

    const fnx = result['fnx'] as Record<string, unknown>[];
    expect(fnx[0]['lineStyle']).toBe('dashed');
  });

  it('should backfill legendLabelFormat', () => {
    const result = migrate({});

    expect(result['legendLabelFormat']).toBe('none');
  });

  it('should preserve existing legendLabelFormat', () => {
    const result = migrate({ legendLabelFormat: 'f(x)=' });

    expect(result['legendLabelFormat']).toBe('f(x)=');
  });

  it('should handle missing fnx gracefully', () => {
    const result = migrate({});

    expect(result['fnx']).toEqual([]);
  });

  describe('polygons migration', () => {
    it('converts each legacy line to an open polygon with connect=false', () => {
      const result = migrate({
        lines: [
          {
            x1: 0,
            y1: 0,
            x2: 2,
            y2: 3,
            color: '#ff0000',
            lineStyle: 'dashed',
          },
        ],
      });

      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons.length).toBe(1);

      const polygon = polygons[0];
      expect(polygon['connect']).toBe(false);
      expect(polygon['lineColor']).toBe('#ff0000');
      expect(polygon['fillColor']).toBe(null);
      expect(polygon['lineStyle']).toBe('dashed');
      expect(polygon['showPoints']).toBe(false);

      const points = polygon['points'] as Record<string, unknown>[];
      expect(points).toEqual([
        { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
        { x: 2, y: 3, labelPosition: 'auto', labelText: '' },
      ]);
    });

    it('converts each legacy area to a closed polygon with black border', () => {
      const result = migrate({
        areas: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'top right', labelText: 'A' },
              { x: 1, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 0, y: 1, labelPosition: 'auto', labelText: '' },
            ],
            color: '#00ff00',
            showPoints: true,
          },
        ],
      });

      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons.length).toBe(1);

      const polygon = polygons[0];
      expect(polygon['connect']).toBe(true);
      expect(polygon['lineColor']).toBe('#000000');
      expect(polygon['fillColor']).toBe('#00ff00');
      expect(polygon['lineStyle']).toBe('solid');
      expect(polygon['showPoints']).toBe(true);

      const points = polygon['points'] as Record<string, unknown>[];
      expect(points).toEqual([
        { x: 0, y: 0, labelPosition: 'top right', labelText: 'A' },
        { x: 1, y: 0, labelPosition: 'auto', labelText: '' },
        { x: 0, y: 1, labelPosition: 'auto', labelText: '' },
      ]);
    });

    it('orders polygons: legacy lines first, then legacy areas', () => {
      const result = migrate({
        lines: [
          { x1: 0, y1: 0, x2: 1, y2: 1, color: '#ff0000', lineStyle: 'solid' },
        ],
        areas: [
          {
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 0, y: 1 },
            ],
            color: '#00ff00',
            showPoints: false,
          },
        ],
      });

      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons.length).toBe(2);
      expect(polygons[0]['lineColor']).toBe('#ff0000');
      expect(polygons[0]['connect']).toBe(false);
      expect(polygons[1]['lineColor']).toBe('#000000');
      expect(polygons[1]['connect']).toBe(true);
    });

    it('yields empty polygons array when there are no lines or areas', () => {
      const result = migrate({});

      expect(result['polygons']).toEqual([]);
    });

    it('defaults labelPosition and labelText for area points that lack them', () => {
      const result = migrate({
        areas: [
          {
            points: [{ x: 0, y: 0 }],
            color: '#ff0000',
            showPoints: false,
          },
        ],
      });

      const polygons = result['polygons'] as Record<string, unknown>[];
      const points = polygons[0]['points'] as Record<string, unknown>[];
      expect(points).toEqual([
        { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
      ]);
    });

    it('removes lines and areas from the output', () => {
      const result = migrate({
        lines: [
          { x1: 0, y1: 0, x2: 1, y2: 1, color: '#ff0000', lineStyle: 'solid' },
        ],
        areas: [
          {
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 0, y: 1 },
            ],
            color: '#00ff00',
            showPoints: false,
          },
        ],
      });

      expect(result['lines']).toBeUndefined();
      expect(result['areas']).toBeUndefined();
    });

    it('is idempotent — running on an already-migrated plot preserves polygons and emits no lines/areas', () => {
      const alreadyMigrated = {
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 1, y: 1, labelPosition: 'auto', labelText: '' },
            ],
            connect: false,
            lineColor: '#ff0000',
            fillColor: null,
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
      };

      const result = migrate(alreadyMigrated);

      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons.length).toBe(1);
      expect(polygons[0]['lineColor']).toBe('#ff0000');
      expect(result['lines']).toBeUndefined();
      expect(result['areas']).toBeUndefined();
    });
  });

  describe('display field defaults', () => {
    it('backfills showAxisArrows to false', () => {
      const result = migrate({});
      expect(result['showAxisArrows']).toBe(false);
    });

    it('preserves existing showAxisArrows', () => {
      const result = migrate({ showAxisArrows: true });
      expect(result['showAxisArrows']).toBe(true);
    });

    it('backfills gridStep to 1', () => {
      const result = migrate({});
      expect(result['gridStep']).toBe('1');
    });

    it('preserves existing gridStep', () => {
      const result = migrate({ gridStep: '0.5' });
      expect(result['gridStep']).toBe('0.5');
    });
  });

  describe('polygon fillStyle backfill', () => {
    it('backfills fillStyle to solid on existing polygons', () => {
      const result = migrate({
        polygons: [
          {
            points: [],
            connect: true,
            lineColor: '#000',
            fillColor: '#fff',
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
      });
      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons[0]['fillStyle']).toBe('solid');
    });

    it('preserves existing fillStyle on existing polygons', () => {
      const result = migrate({
        polygons: [
          {
            points: [],
            connect: true,
            lineColor: '#000',
            fillColor: '#fff',
            lineStyle: 'solid',
            showPoints: false,
            fillStyle: 'hatched',
            isSolution: false,
          },
        ],
      });
      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons[0]['fillStyle']).toBe('hatched');
    });

    it('sets fillStyle solid on legacy lines and areas', () => {
      const result = migrate({
        lines: [
          { x1: 0, y1: 0, x2: 1, y2: 1, color: '#ff0000', lineStyle: 'solid' },
        ],
        areas: [
          {
            points: [{ x: 0, y: 0 }],
            color: '#00ff00',
            showPoints: false,
          },
        ],
      });
      const polygons = result['polygons'] as Record<string, unknown>[];
      expect(polygons[0]['fillStyle']).toBe('solid');
      expect(polygons[1]['fillStyle']).toBe('solid');
    });
  });

  describe('reflection backfill', () => {
    it('backfills reflection to kind="none" when missing', () => {
      const result = migrate({});
      expect(result['reflection']).toEqual({ kind: 'none' });
    });

    it('preserves point and backfills isSolution=false when missing', () => {
      const reflection = { kind: 'point', point: { x: 1, y: 2 } };
      const result = migrate({ reflection });
      expect(result['reflection']).toEqual({
        ...reflection,
        isSolution: false,
      });
    });

    it('preserves axis and backfills isSolution=false when missing', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      };
      const result = migrate({ reflection });
      expect(result['reflection']).toEqual({
        ...reflection,
        isSolution: false,
        color: '#ff0000',
        lineStyle: 'solid',
        extendBeyondPoints: false,
      });
    });

    it('backfills axis color to red when missing', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      };
      const result = migrate({ reflection });
      expect((result['reflection'] as Record<string, unknown>)['color']).toBe(
        '#ff0000',
      );
    });

    it('preserves existing axis color', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        color: '#00ff00',
      };
      const result = migrate({ reflection });
      expect((result['reflection'] as Record<string, unknown>)['color']).toBe(
        '#00ff00',
      );
    });

    it('backfills axis lineStyle to solid when missing', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      };
      const result = migrate({ reflection });
      expect(
        (result['reflection'] as Record<string, unknown>)['lineStyle'],
      ).toBe('solid');
    });

    it('preserves existing axis lineStyle', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        lineStyle: 'dashed',
      };
      const result = migrate({ reflection });
      expect(
        (result['reflection'] as Record<string, unknown>)['lineStyle'],
      ).toBe('dashed');
    });

    it('backfills axis extendBeyondPoints to false when missing', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      };
      const result = migrate({ reflection });
      expect(
        (result['reflection'] as Record<string, unknown>)['extendBeyondPoints'],
      ).toBe(false);
    });

    it('preserves existing axis extendBeyondPoints=true', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        extendBeyondPoints: true,
      };
      const result = migrate({ reflection });
      expect(
        (result['reflection'] as Record<string, unknown>)['extendBeyondPoints'],
      ).toBe(true);
    });

    it('preserves existing isSolution=true on point reflection', () => {
      const reflection = {
        kind: 'point',
        point: { x: 1, y: 2 },
        isSolution: true,
      };
      const result = migrate({ reflection });
      expect(result['reflection']).toEqual(reflection);
    });

    it('preserves existing isSolution=true on axis reflection', () => {
      const reflection = {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        isSolution: true,
      };
      const result = migrate({ reflection });
      expect(result['reflection']).toEqual({
        ...reflection,
        color: '#ff0000',
        lineStyle: 'solid',
        extendBeyondPoints: false,
      });
    });
  });
});
