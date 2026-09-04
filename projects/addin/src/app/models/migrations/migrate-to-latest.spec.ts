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

  it('should backfill axisSnapping with extending per axis', () => {
    const result = migrate({});

    expect(result['axisSnapping']).toEqual({ x: 'extend', y: 'extend' });
  });

  it('should preserve an existing axisSnapping', () => {
    const result = migrate({ axisSnapping: { x: 'shrink', y: 'extend' } });

    expect(result['axisSnapping']).toEqual({ x: 'shrink', y: 'extend' });
  });
});
