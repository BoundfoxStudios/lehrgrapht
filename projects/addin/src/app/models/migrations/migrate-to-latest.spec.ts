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

  it('should backfill lines lineStyle to solid', () => {
    const result = migrate({
      lines: [{ x1: 0, y1: 0, x2: 1, y2: 1, color: '#000' }],
    });

    const lines = result['lines'] as Record<string, unknown>[];
    expect(lines[0]['lineStyle']).toBe('solid');
  });

  it('should preserve existing lines lineStyle', () => {
    const result = migrate({
      lines: [
        { x1: 0, y1: 0, x2: 1, y2: 1, color: '#000', lineStyle: 'dashed' },
      ],
    });

    const lines = result['lines'] as Record<string, unknown>[];
    expect(lines[0]['lineStyle']).toBe('dashed');
  });

  it('should handle missing lines gracefully', () => {
    const result = migrate({});

    expect(result['lines']).toEqual([]);
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
});
