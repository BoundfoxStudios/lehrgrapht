import { Plot, PlotSettings, PolygonPoint } from '../../models/plot';
import { PlotDataService } from './plot-data.service';
import { PLOT_CONSTANTS } from './plot.types';

const plotSettings: PlotSettings = {
  zeroLineWidth: 1,
  zeroLineColor: '#000000',
  gridLineWidth: 0.5,
  gridLineColor: '#cccccc',
  plotLineWidth: 1.5,
  markerNamingScheme: 'alphabetic',
  legendLabelFormat: 'none',
};

const basePlot: Plot = {
  version: '1.0',
  name: 'test',
  range: { x: { min: -5, max: 5 }, y: { min: -5, max: 5 } },
  fnx: [],
  markers: [],
  areas: [],
  lines: [],
  polygons: [],
  showAxisLabels: true,
  showAxis: true,
  placeAxisLabelsInside: false,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
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
          {
            fnx: 'x^2',
            color: '#ff0000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
          {
            fnx: 'sin(x)',
            color: '#00ff00',
            legendPosition: 'start',
            lineStyle: 'solid',
          },
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

    it('should use solid dash for solid lineStyle', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x',
            color: '#000',
            legendPosition: 'none',
            lineStyle: 'solid',
          },
        ],
      };
      const result = service.buildFunctionTraces(
        plot,
        plotSettings,
        [0, 1],
        [[0, 1]],
      );
      expect(result[0].line?.dash).toBe('solid');
    });

    it('should use dash for dashed lineStyle', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x',
            color: '#000',
            legendPosition: 'none',
            lineStyle: 'dashed',
          },
        ],
      };
      const result = service.buildFunctionTraces(
        plot,
        plotSettings,
        [0, 1],
        [[0, 1]],
      );
      expect(result[0].line?.dash).toBe('dash');
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

  describe('buildPolygonTraces', () => {
    it('returns empty array when no polygons', () => {
      const result = service.buildPolygonTraces(basePlot, plotSettings);
      expect(result).toEqual([]);
    });

    it('renders an open polygon as a polyline without fill', () => {
      const plot: Plot = {
        ...basePlot,
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 1, y: 1, labelPosition: 'auto', labelText: '' },
              { x: 2, y: 0, labelPosition: 'auto', labelText: '' },
            ],
            connect: false,
            lineColor: '#ff0000',
            fillColor: '#00ff00',
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
      };
      const result = service.buildPolygonTraces(plot, plotSettings);
      expect(result.length).toBe(1);
      const trace = result[0];
      expect(trace.fill).toBe('none');
      expect(trace.line?.color).toBe('#ff0000');
      expect(trace.x).toEqual([0, 1, 2]);
      expect(trace.y).toEqual([0, 1, 0]);
    });

    it('renders a closed polygon with fill and closes the line', () => {
      const plot: Plot = {
        ...basePlot,
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 1, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 0, y: 1, labelPosition: 'auto', labelText: '' },
            ],
            connect: true,
            lineColor: '#000000',
            fillColor: '#ff0000',
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
      };
      const result = service.buildPolygonTraces(plot, plotSettings);
      const trace = result[0];
      expect(trace.fill).toBe('toself');
      expect(trace.fillcolor).toBe('rgba(255, 0, 0, 0.7)');
      expect(trace.line?.color).toBe('#000000');
      expect(trace.line?.width).toBe(plotSettings.plotLineWidth);
      const xs = trace.x as number[];
      expect(xs.length).toBe(4);
      expect(xs[0]).toBe(xs[3]);
    });

    it('renders a closed polygon without fill as outline only', () => {
      const plot: Plot = {
        ...basePlot,
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 1, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 0, y: 1, labelPosition: 'auto', labelText: '' },
            ],
            connect: true,
            lineColor: '#0000ff',
            fillColor: null,
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
      };
      const result = service.buildPolygonTraces(plot, plotSettings);
      const trace = result[0];
      expect(trace.fill).toBe('none');
      const xs = trace.x as number[];
      expect(xs.length).toBe(4);
      expect(xs[0]).toBe(xs[3]);
    });

    it('emits a dashed pattern over the full perimeter for dashed polygons', () => {
      // 3-4-5 right triangle: perimeter = 3 + 4 + 5 = 12 units
      const plot: Plot = {
        ...basePlot,
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 4, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 4, y: 3, labelPosition: 'auto', labelText: '' },
            ],
            connect: true,
            lineColor: '#000000',
            fillColor: null,
            lineStyle: 'dashed',
            showPoints: false,
          },
        ],
      };
      const result = service.buildPolygonTraces(plot, plotSettings);
      const dash = result[0].line?.dash as string;
      const match = /^([\d.]+)px,([\d.]+)px$/.exec(dash);
      if (!match) throw new Error(`Unexpected dash pattern: ${dash}`);

      const dashPx = parseFloat(match[1]);
      const gapPx = parseFloat(match[2]);
      const period = dashPx + gapPx;

      const { dtick, mmPerTick, mmToInches, ppiBase } = PLOT_CONSTANTS;
      const pxPerUnit = (mmPerTick / dtick) * mmToInches * ppiBase;
      const perimeterPx = 12 * pxPerUnit;
      const numPeriods = perimeterPx / period;

      expect(numPeriods).toBeCloseTo(Math.round(numPeriods), 5);
    });

    it('does not crash on an empty closed polygon', () => {
      const plot: Plot = {
        ...basePlot,
        polygons: [
          {
            points: [],
            connect: true,
            lineColor: '#000',
            fillColor: null,
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
      };
      expect(() =>
        service.buildPolygonTraces(plot, plotSettings),
      ).not.toThrow();
      const result = service.buildPolygonTraces(plot, plotSettings);
      expect(result.length).toBe(1);
      expect(result[0].x).toEqual([]);
    });

    it('includes point marker traces when showPoints is true', () => {
      const plot: Plot = {
        ...basePlot,
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: 'A' },
              { x: 1, y: 0, labelPosition: 'auto', labelText: 'B' },
              { x: 0, y: 1, labelPosition: 'auto', labelText: 'C' },
            ],
            connect: true,
            lineColor: '#000000',
            fillColor: '#ff0000',
            lineStyle: 'solid',
            showPoints: true,
          },
        ],
      };
      const result = service.buildPolygonTraces(plot, plotSettings);
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('buildPlotData', () => {
    it('should combine all trace types', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x',
            color: '#000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
        ],
        markers: [{ x: 1, y: 1, text: 'P' }],
        polygons: [
          {
            points: [
              { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
              { x: 1, y: 1, labelPosition: 'auto', labelText: '' },
            ],
            connect: false,
            lineColor: '#000',
            fillColor: null,
            lineStyle: 'solid',
            showPoints: false,
          },
        ],
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
    const makePoint = (x: number, y: number): PolygonPoint => ({
      x,
      y,
      labelPosition: 'auto',
      labelText: '',
    });

    const triangle: PolygonPoint[] = [
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
      const square: PolygonPoint[] = [
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
