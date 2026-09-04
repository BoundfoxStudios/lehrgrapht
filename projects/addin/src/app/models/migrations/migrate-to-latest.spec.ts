import { migrateToLatest } from './migrate-to-latest';

describe('migrate-to-latest', () => {
  const migrate = migrateToLatest.migrate;

  it('should backfill unitsPerSquare with half a unit per axis', () => {
    const result = migrate({});

    expect(result['unitsPerSquare']).toEqual({ x: 0.5, y: 0.5 });
  });

  it('should preserve an existing unitsPerSquare', () => {
    const result = migrate({ unitsPerSquare: { x: 1, y: 20 } });

    expect(result['unitsPerSquare']).toEqual({ x: 1, y: 20 });
  });

  it('should backfill squareRounding with rounding up per axis', () => {
    const result = migrate({});

    expect(result['squareRounding']).toEqual({ x: 'up', y: 'up' });
  });

  it('should preserve an existing squareRounding', () => {
    const result = migrate({ squareRounding: { x: 'down', y: 'up' } });

    expect(result['squareRounding']).toEqual({ x: 'down', y: 'up' });
  });
});
