import { MigrationService } from './migration';

describe('MigrationService', () => {
  const service = new MigrationService();

  it('should apply the latest migration to a plot saved by an older release', () => {
    const result = service.migrate({ version: '1.8.0' });

    expect(result.plot.unitsPerSquare).toEqual({ x: 0.5, y: 0.5 });
    expect(result.plot.axisSnapping).toEqual({ x: 'extend', y: 'extend' });
    expect(result.wasMigrated).toBe(true);
  });
});
