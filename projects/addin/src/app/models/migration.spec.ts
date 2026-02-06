import { TestBed } from '@angular/core/testing';
import { MigrationService } from './migration';

describe('MigrationService', () => {
  let service: MigrationService;

  beforeEach(() => {
    service = TestBed.inject(MigrationService);
  });

  it('should skip migration for dev version 0.0.0', () => {
    const raw = { version: '0.0.0', name: 'test' };
    const result = service.migrate(raw);

    expect(result.wasMigrated).toBe(false);
    expect(result.plot).toBe(raw);
  });

  it('should treat plots without version as 1.4.1', () => {
    const raw = {
      name: 'old plot',
      range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
      fnx: [],
      markers: [],
      areas: [],
      lines: [],
      showAxis: true,
      showAxisLabels: true,
      placeAxisLabelsInside: true,
      squarePlots: false,
      automaticallyAdjustLimitsToValueRange: false,
    };

    const result = service.migrate(raw);

    expect(result.wasMigrated).toBe(true);
    expect(result.plot.axisLabelX).toBe('x');
    expect(result.plot.axisLabelY).toBe('y');
  });

  describe('migrate-to-latest (from 1.4.1)', () => {
    it('should backfill axisLabelX and axisLabelY', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [],
      };

      const result = service.migrate(raw);

      expect(result.wasMigrated).toBe(true);
      expect(result.plot.axisLabelX).toBe('x');
      expect(result.plot.axisLabelY).toBe('y');
    });

    it('should preserve existing axisLabelX and axisLabelY', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [],
        axisLabelX: 'Zeit',
        axisLabelY: 'Strecke',
      };

      const result = service.migrate(raw);

      expect(result.plot.axisLabelX).toBe('Zeit');
      expect(result.plot.axisLabelY).toBe('Strecke');
    });

    it('should backfill area.showPoints', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [
          {
            points: [],
            color: '#000',
          },
        ],
      };

      const result = service.migrate(raw);

      expect(result.plot.areas[0].showPoints).toBe(false);
    });

    it('should preserve existing area.showPoints', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [
          {
            points: [],
            color: '#000',
            showPoints: true,
          },
        ],
      };

      const result = service.migrate(raw);

      expect(result.plot.areas[0].showPoints).toBe(true);
    });

    it('should backfill area point labelPosition and labelText', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [
          {
            points: [{ x: 1, y: 2 }],
            color: '#000',
          },
        ],
      };

      const result = service.migrate(raw);

      expect(result.plot.areas[0].points[0].labelPosition).toBe('auto');
      expect(result.plot.areas[0].points[0].labelText).toBe('');
    });

    it('should preserve existing area point labelPosition and labelText', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [
          {
            points: [{ x: 1, y: 2, labelPosition: 'top left', labelText: 'A' }],
            color: '#000',
          },
        ],
      };

      const result = service.migrate(raw);

      expect(result.plot.areas[0].points[0].labelPosition).toBe('top left');
      expect(result.plot.areas[0].points[0].labelText).toBe('A');
    });

    it('should stamp the current version after migration', () => {
      const raw = {
        version: '1.4.1',
        name: 'test',
        areas: [],
      };

      const result = service.migrate(raw);

      expect(result.plot.version).toBeDefined();
      expect(result.plot.version).not.toBe('1.4.1');
    });
  });
});
