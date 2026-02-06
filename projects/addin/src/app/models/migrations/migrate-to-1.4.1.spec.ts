import { migrateTo141 } from './migrate-to-1.4.1';

describe('migrate-to-1.4.1', () => {
  const migrate = migrateTo141.migrate;

  it('should backfill axisLabelX and axisLabelY', () => {
    const result = migrate({ areas: [] });

    expect(result['axisLabelX']).toBe('x');
    expect(result['axisLabelY']).toBe('y');
  });

  it('should preserve existing axisLabelX and axisLabelY', () => {
    const result = migrate({
      areas: [],
      axisLabelX: 'Zeit',
      axisLabelY: 'Strecke',
    });

    expect(result['axisLabelX']).toBe('Zeit');
    expect(result['axisLabelY']).toBe('Strecke');
  });

  it('should backfill area.showPoints', () => {
    const result = migrate({
      areas: [{ points: [], color: '#000' }],
    });

    const areas = result['areas'] as Record<string, unknown>[];
    expect(areas[0]['showPoints']).toBe(false);
  });

  it('should preserve existing area.showPoints', () => {
    const result = migrate({
      areas: [{ points: [], color: '#000', showPoints: true }],
    });

    const areas = result['areas'] as Record<string, unknown>[];
    expect(areas[0]['showPoints']).toBe(true);
  });

  it('should backfill area point labelPosition and labelText', () => {
    const result = migrate({
      areas: [{ points: [{ x: 1, y: 2 }], color: '#000' }],
    });

    const areas = result['areas'] as Record<string, unknown>[];
    const points = areas[0]['points'] as Record<string, unknown>[];
    expect(points[0]['labelPosition']).toBe('auto');
    expect(points[0]['labelText']).toBe('');
  });

  it('should preserve existing area point labelPosition and labelText', () => {
    const result = migrate({
      areas: [
        {
          points: [{ x: 1, y: 2, labelPosition: 'top left', labelText: 'A' }],
          color: '#000',
        },
      ],
    });

    const areas = result['areas'] as Record<string, unknown>[];
    const points = areas[0]['points'] as Record<string, unknown>[];
    expect(points[0]['labelPosition']).toBe('top left');
    expect(points[0]['labelText']).toBe('A');
  });

  it('should handle missing areas gracefully', () => {
    const result = migrate({});

    const areas = result['areas'] as Record<string, unknown>[];
    expect(areas).toEqual([]);
  });
});
