import { AreaPoint, Plot, PlotSettings } from '../../models/plot';
import { PlotDataService } from './plot-data.service';

const plotSettings: PlotSettings = {
  zeroLineWidth: 1,
  zeroLineColor: '#000000',
  gridLineWidth: 0.5,
  gridLineColor: '#cccccc',
  plotLineWidth: 1.5,
  markerNamingScheme: 'alphabetic',
};

const basePlot: Plot = {
  version: '1.0',
  name: 'test',
  range: { x: { min: -5, max: 5 }, y: { min: -5, max: 5 } },
  fnx: [],
  markers: [],
  areas: [],
  lines: [],
  showAxisLabels: true,
  showAxis: true,
  placeAxisLabelsInside: false,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
};

describe('PlotDataService', () => {
  const service = new PlotDataService();

  describe('buildFunctionTraces', () => {
    it('should return empty array when no functions', () => {
      const result = service.buildFunctionTraces(
        basePlot,
        plotSettings,
        [],
        [],
      );
      expect(result).toEqual([]);
    });

    it('should return one trace per function', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          { fnx: 'x^2', color: '#ff0000', legendPosition: 'end' },
          { fnx: 'sin(x)', color: '#00ff00', legendPosition: 'start' },
        ],
      };
      const xValues = [0, 1, 2];
      const yValues = [
        [0, 1, 4],
        [0, 0.84, 0.91],
      ];
      const result = service.buildFunctionTraces(
        plot,
        plotSettings,
        xValues,
        yValues,
      );
      expect(result.length).toBe(2);
      expect(result[0].line?.color).toBe('#ff0000');
      expect(result[1].line?.color).toBe('#00ff00');
    });
  });

  describe('buildMarkerTraces', () => {
    it('should return empty array when no markers', () => {
      const result = service.buildMarkerTraces(basePlot);
      expect(result).toEqual([]);
    });

    it('should return one trace with all markers', () => {
      const plot: Plot = {
        ...basePlot,
        markers: [
          { x: 1, y: 2, text: 'A' },
          { x: 3, y: 4, text: 'B' },
        ],
      };
      const result = service.buildMarkerTraces(plot);
      expect(result.length).toBe(1);
      expect(result[0].x).toEqual([1, 3]);
      expect(result[0].y).toEqual([2, 4]);
      expect(result[0].text).toEqual(['A', 'B']);
    });
  });

  describe('buildLineTraces', () => {
    it('should return empty array when no lines', () => {
      const result = service.buildLineTraces(basePlot, plotSettings);
      expect(result).toEqual([]);
    });

    it('should return one trace per line', () => {
      const plot: Plot = {
        ...basePlot,
        lines: [
          { x1: 0, y1: 0, x2: 1, y2: 1, color: '#ff0000' },
          { x1: 2, y1: 2, x2: 3, y2: 3, color: '#00ff00' },
        ],
      };
      const result = service.buildLineTraces(plot, plotSettings);
      expect(result.length).toBe(2);
      expect(result[0].x).toEqual([0, 1]);
      expect(result[0].y).toEqual([0, 1]);
      expect(result[0].line?.color).toBe('#ff0000');
    });
  });

  describe('buildAreaTraces', () => {
    it('should return empty array when no areas', () => {
      const result = service.buildAreaTraces(basePlot, plotSettings);
      expect(result).toEqual([]);
    });

    it('should create fill trace with closed polygon', () => {
      const plot: Plot = {
        ...basePlot,
        areas: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 1, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 0, y: 1, labelPosition: 'auto', labelText: '' },
            ],
            color: '#ff0000',
            showPoints: false,
          },
        ],
      };
      const result = service.buildAreaTraces(plot, plotSettings);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const trace = result[0];
      const xArr = trace.x as number[];
      expect(xArr.length).toBe(4);
      expect(xArr[0]).toBe(xArr[3]);
    });

    it('should include area point marker traces when showPoints is true', () => {
      const plot: Plot = {
        ...basePlot,
        areas: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: 'A' },
              { x: 1, y: 0, labelPosition: 'auto', labelText: 'B' },
              { x: 0, y: 1, labelPosition: 'auto', labelText: 'C' },
            ],
            color: '#ff0000',
            showPoints: true,
          },
        ],
      };
      const result = service.buildAreaTraces(plot, plotSettings);
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('buildPlotData', () => {
    it('should combine all trace types', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [{ fnx: 'x', color: '#000', legendPosition: 'end' }],
        markers: [{ x: 1, y: 1, text: 'P' }],
        lines: [{ x1: 0, y1: 0, x2: 1, y2: 1, color: '#000' }],
      };
      const result = service.buildPlotData(
        plot,
        plotSettings,
        [0, 1],
        [[0, 1]],
      );
      expect(result.length).toBe(3);
    });

    it('should return empty array for empty plot', () => {
      const result = service.buildPlotData(basePlot, plotSettings, [], []);
      expect(result).toEqual([]);
    });
  });

  describe('calculateLabelPosition', () => {
    const makePoint = (x: number, y: number): AreaPoint => ({
      x,
      y,
      labelPosition: 'auto',
      labelText: '',
    });

    const triangle: AreaPoint[] = [
      makePoint(0, 2),
      makePoint(-2, -1),
      makePoint(2, -1),
    ];

    it('should return "bottom right" for point to the lower-right of centroid', () => {
      const point = makePoint(2, -1);
      expect(service.calculateLabelPosition(point, triangle)).toBe(
        'bottom right',
      );
    });

    it('should return "top center" for point above centroid', () => {
      const point = makePoint(0, 2);
      expect(service.calculateLabelPosition(point, triangle)).toBe(
        'top center',
      );
    });

    it('should return "middle left" for point to the left of centroid', () => {
      const point = makePoint(-3, 0);
      expect(
        service.calculateLabelPosition(point, [
          makePoint(-3, 0),
          makePoint(3, 0),
          makePoint(0, 3),
        ]),
      ).toBe('middle left');
    });

    it('should return "bottom center" for point below centroid', () => {
      const point = makePoint(0, -3);
      expect(
        service.calculateLabelPosition(point, [
          makePoint(0, -3),
          makePoint(-2, 2),
          makePoint(2, 2),
        ]),
      ).toBe('bottom center');
    });

    it('should handle all 8 directions', () => {
      const square: AreaPoint[] = [
        makePoint(1, 1),
        makePoint(-1, 1),
        makePoint(-1, -1),
        makePoint(1, -1),
      ];

      expect(service.calculateLabelPosition(makePoint(3, 0), square)).toBe(
        'middle right',
      );
      expect(service.calculateLabelPosition(makePoint(3, 3), square)).toBe(
        'top right',
      );
      expect(service.calculateLabelPosition(makePoint(0, 3), square)).toBe(
        'top center',
      );
      expect(service.calculateLabelPosition(makePoint(-3, 3), square)).toBe(
        'top left',
      );
      expect(service.calculateLabelPosition(makePoint(-3, 0), square)).toBe(
        'middle left',
      );
      expect(service.calculateLabelPosition(makePoint(-3, -3), square)).toBe(
        'bottom left',
      );
      expect(service.calculateLabelPosition(makePoint(0, -3), square)).toBe(
        'bottom center',
      );
      expect(service.calculateLabelPosition(makePoint(3, -3), square)).toBe(
        'bottom right',
      );
    });
  });
});
