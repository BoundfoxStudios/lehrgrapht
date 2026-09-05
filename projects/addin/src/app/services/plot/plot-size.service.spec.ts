import { Plot } from '../../models/plot';
import { CleanedValues, PLOT_CONSTANTS } from './plot.types';
import { PlotSizeService } from './plot-size.service';
import { math } from '../../utils/math';

const basePlot: Plot = {
  version: '1.0',
  name: 'test',
  range: { x: { min: -5, max: 5 }, y: { min: -5, max: 5 } },
  unitsPerSquare: { x: 0.5, y: 0.5 },
  axisSnapping: { x: 'extend', y: 'extend' },
  fnx: [],
  markers: [],
  polygons: [],
  showAxisLabels: true,
  showAxis: true,
  placeAxisLabelsInside: false,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
  showAxisArrows: false,
  gridStep: '1',
  reflection: { kind: 'none' },
};

describe('PlotSizeService', () => {
  const service = new PlotSizeService();

  describe('calculateEffectiveMargin', () => {
    it('should return base margins when no legend functions', () => {
      const margin = service.calculateEffectiveMargin(basePlot);
      expect(margin.t).toBe(PLOT_CONSTANTS.mmMargin.t);
      expect(margin.b).toBe(PLOT_CONSTANTS.mmMargin.b);
      expect(margin.l).toBe(PLOT_CONSTANTS.mmMargin.l);
      expect(margin.r).toBe(PLOT_CONSTANTS.mmMargin.r);
    });

    it('should return base margins when legend position is none', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x^2',
            color: '#000',
            legendPosition: 'none',
            lineStyle: 'solid',
          },
        ],
      };
      const margin = service.calculateEffectiveMargin(plot);
      expect(margin.l).toBe(PLOT_CONSTANTS.mmMargin.l);
      expect(margin.r).toBe(PLOT_CONSTANTS.mmMargin.r);
    });

    it('should increase left margin for start legend with long expression', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'sin(x) + cos(x) * 2',
            color: '#000',
            legendPosition: 'start',
            lineStyle: 'solid',
          },
        ],
      };
      const margin = service.calculateEffectiveMargin(plot);
      expect(margin.l).toBeGreaterThan(PLOT_CONSTANTS.mmMargin.l);
      expect(margin.r).toBe(PLOT_CONSTANTS.mmMargin.r);
    });

    it('should increase right margin for end legend with long expression', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'sin(x) + cos(x) * 2',
            color: '#000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
        ],
      };
      const margin = service.calculateEffectiveMargin(plot);
      expect(margin.l).toBe(PLOT_CONSTANTS.mmMargin.l);
      expect(margin.r).toBeGreaterThan(PLOT_CONSTANTS.mmMargin.r);
    });

    it('should not reduce margins below base for short expressions', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x',
            color: '#000',
            legendPosition: 'start',
            lineStyle: 'solid',
          },
        ],
      };
      const margin = service.calculateEffectiveMargin(plot);
      expect(margin.l).toBeGreaterThanOrEqual(PLOT_CONSTANTS.mmMargin.l);
    });

    it('uses measured label width when provided for end-positioned legend', () => {
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
      };
      // 400 px wide is far more than the heuristic would predict for "x".
      const measured = new Map([[0, 400]]);
      const margin = service.calculateEffectiveMargin(plot, measured);
      // Right margin must grow to accommodate the actual rendered width:
      // 400 px ≈ 105.8 mm, minus 7.5 mm base, plus 7.5 mm base = ~105.8+.
      expect(margin.r).toBeGreaterThan(100);
      expect(margin.l).toBe(PLOT_CONSTANTS.mmMargin.l);
    });

    it('uses measured label width when provided for start-positioned legend', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x',
            color: '#000',
            legendPosition: 'start',
            lineStyle: 'solid',
          },
        ],
      };
      const measured = new Map([[0, 400]]);
      const margin = service.calculateEffectiveMargin(plot, measured);
      expect(margin.l).toBeGreaterThan(100);
      expect(margin.r).toBe(PLOT_CONSTANTS.mmMargin.r);
    });

    it('falls back to heuristic when measurement is missing for a function', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'sin(x) + cos(x) * 2',
            color: '#000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
        ],
      };
      const marginHeuristic = service.calculateEffectiveMargin(plot);
      // Empty measurement map: still falls back to heuristic for index 0.
      const marginNoMeasure = service.calculateEffectiveMargin(plot, new Map());
      expect(marginNoMeasure.r).toBeCloseTo(marginHeuristic.r, 5);
    });

    it('chooses the larger side when multiple functions share a side', () => {
      const plot: Plot = {
        ...basePlot,
        fnx: [
          {
            fnx: 'x',
            color: '#000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
          {
            fnx: 'x^2',
            color: '#000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
        ],
      };
      const measured = new Map([
        [0, 100],
        [1, 300],
      ]);
      const margin = service.calculateEffectiveMargin(plot, measured);
      // Right margin should reflect the wider label (index 1), not the smaller (index 0).
      const expectedFromLarger = (300 + 5) * (25.4 / PLOT_CONSTANTS.ppiBase);
      // The margin is base.r + extra, where extra = max(0, expectedFromLarger - base.l).
      const expectedExtra = Math.max(
        0,
        expectedFromLarger - PLOT_CONSTANTS.mmMargin.l,
      );
      expect(margin.r).toBeCloseTo(
        PLOT_CONSTANTS.mmMargin.r + expectedExtra,
        5,
      );
    });
  });

  describe('calculatePlotSize', () => {
    it('should calculate size in px and points', () => {
      const xNumbers = math.range(-5, 5, 0.1, true).toArray() as number[];
      const yNumbers = math.range(-5, 5, 0.1, true).toArray() as number[];

      const cleanedValues: CleanedValues = {
        cleanXValues: xNumbers,
        cleanYValues: [yNumbers],
      };

      const margin = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };
      const result = service.calculatePlotSize(basePlot, cleanedValues, margin);

      expect(result.xValueMin).toBeCloseTo(-5);
      expect(result.xValueMax).toBeCloseTo(5);
      expect(result.yValueMin).toBeCloseTo(-5);
      expect(result.yValueMax).toBeCloseTo(5);
      expect(result.plotSizePx.width).toBeGreaterThan(0);
      expect(result.plotSizePx.height).toBeGreaterThan(0);
      expect(result.plotSizePoints.width).toBeGreaterThan(0);
      expect(result.plotSizePoints.height).toBeGreaterThan(0);
    });

    it('should produce square dimensions for square plots', () => {
      const plot: Plot = {
        ...basePlot,
        squarePlots: true,
        range: { x: { min: -2, max: 2 }, y: { min: -5, max: 5 } },
      };
      const xNumbers = math.range(-2, 2, 0.1, true).toArray() as number[];
      const yNumbers = math.range(-5, 5, 0.1, true).toArray() as number[];

      const cleanedValues: CleanedValues = {
        cleanXValues: xNumbers,
        cleanYValues: [yNumbers],
      };
      const margin = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };
      const result = service.calculatePlotSize(plot, cleanedValues, margin);

      expect(result.plotSizePx.width).toBeCloseTo(result.plotSizePx.height, 5);
    });

    it('should keep the axis range at the value bounds for non-square plots', () => {
      const xNumbers = math.range(-5, 5, 0.1, true).toArray() as number[];
      const yNumbers = math.range(-1, 1, 0.1, true).toArray() as number[];

      const result = service.calculatePlotSize(
        {
          ...basePlot,
          range: { x: { min: -5, max: 5 }, y: { min: -1, max: 1 } },
        },
        { cleanXValues: xNumbers, cleanYValues: [yNumbers] },
        { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
      );

      expect(result.axisRange.x).toEqual({ min: -5, max: 5 });
      expect(result.axisRange.y).toEqual({ min: -1, max: 1 });
    });

    it('should extend the shorter axis at its maximum for square plots', () => {
      const xNumbers = math.range(-3, 3, 0.1, true).toArray() as number[];
      const yNumbers = math.range(-1, 1, 0.1, true).toArray() as number[];

      const result = service.calculatePlotSize(
        {
          ...basePlot,
          squarePlots: true,
          range: { x: { min: -3, max: 3 }, y: { min: -1, max: 1 } },
        },
        { cleanXValues: xNumbers, cleanYValues: [yNumbers] },
        { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
      );

      expect(result.axisRange.x).toEqual({ min: -3, max: 3 });
      expect(result.axisRange.y).toEqual({ min: -1, max: 5 });
      expect(result.yValueMin).toBe(-1);
      expect(result.yValueMax).toBe(1);
    });

    it('should raise the maximum of an axis that extends to a whole square', () => {
      const result = service.calculatePlotSize(
        {
          ...basePlot,
          range: { x: { min: -3, max: 3 }, y: { min: 0, max: 150 } },
          unitsPerSquare: { x: 0.5, y: 20 },
          gridStep: '0.5',
        },
        { cleanXValues: [], cleanYValues: [[]] },
        { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
      );

      expect(result.axisRange.y).toEqual({ min: 0, max: 160 });
      expect(result.yValueMax).toBe(150);
    });

    it('should lower the maximum of an axis that shrinks to a whole square', () => {
      const result = service.calculatePlotSize(
        {
          ...basePlot,
          range: { x: { min: -3, max: 3 }, y: { min: 0, max: 150 } },
          unitsPerSquare: { x: 0.5, y: 20 },
          axisSnapping: { x: 'extend', y: 'shrink' },
          gridStep: '0.5',
        },
        { cleanXValues: [], cleanYValues: [[]] },
        { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
      );

      expect(result.axisRange.y).toEqual({ min: 0, max: 140 });
      expect(result.yValueMax).toBe(150);
    });

    it('should keep the axis range in data units when the axis scales differ', () => {
      const result = service.calculatePlotSize(
        {
          ...basePlot,
          range: { x: { min: 9, max: 20 }, y: { min: 0, max: 200 } },
          unitsPerSquare: { x: 1, y: 20 },
          gridStep: '0.5',
        },
        { cleanXValues: [], cleanYValues: [[]] },
        { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
      );

      expect(result.axisRange.x).toEqual({ min: 9, max: 20 });
      expect(result.axisRange.y).toEqual({ min: 0, max: 200 });
    });

    it('should draw both bounds of a scaled axis on a grid line', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: -8, max: 10 }, y: { min: -5, max: 5 } },
        unitsPerSquare: { x: 1.5, y: 0.5 },
        gridStep: '0.5',
      };
      const cleanedValues: CleanedValues = {
        cleanXValues: [],
        cleanYValues: [[]],
      };
      const margin = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };

      expect(
        service.calculatePlotSize(plot, cleanedValues, margin).axisRange.x,
      ).toEqual({ min: -9, max: 10.5 });
      expect(
        service.calculatePlotSize(
          { ...plot, axisSnapping: { x: 'shrink', y: 'extend' } },
          cleanedValues,
          margin,
        ).axisRange.x,
      ).toEqual({ min: -7.5, max: 9 });
    });

    it('should snap to every second square when a grid line is drawn only there', () => {
      const result = service.calculatePlotSize(
        {
          ...basePlot,
          range: { x: { min: 9, max: 20 }, y: { min: 0, max: 200 } },
          unitsPerSquare: { x: 1, y: 20 },
          gridStep: '1',
        },
        { cleanXValues: [], cleanYValues: [[]] },
        { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
      );

      expect(result.axisRange.x).toEqual({ min: 8, max: 20 });
      expect(result.axisRange.y).toEqual({ min: 0, max: 200 });
    });
  });

  describe('calculatePlotSizeMm', () => {
    it('should calculate size in mm', () => {
      const result = service.calculatePlotSizeMm(basePlot);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should detect A4 overflow for large ranges', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: -50, max: 50 }, y: { min: -50, max: 50 } },
      };
      const result = service.calculatePlotSizeMm(plot);
      expect(result.exceedsA4).toBe(true);
    });

    it('should not exceed A4 for small ranges', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: -2, max: 2 }, y: { min: -2, max: 2 } },
      };
      const result = service.calculatePlotSizeMm(plot);
      expect(result.exceedsA4).toBe(false);
    });

    it('should detect width overflow separately', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: -50, max: 50 }, y: { min: -1, max: 1 } },
      };
      const result = service.calculatePlotSizeMm(plot);
      expect(result.exceedsWidth).toBe(true);
      expect(result.exceedsHeight).toBe(false);
    });

    it('should size each axis from its own units per square', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: 9, max: 20 }, y: { min: 0, max: 200 } },
        unitsPerSquare: { x: 1, y: 20 },
        gridStep: '0.5',
      };
      const result = service.calculatePlotSizeMm(plot);

      expect(result.width).toBeCloseTo(11 * 5 + 15, 5);
      expect(result.height).toBeCloseTo(10 * 5 + 15, 5);
    });

    it('should size an axis whose bounds snap outwards from the entered range', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: -8, max: 10 }, y: { min: -5, max: 5 } },
        unitsPerSquare: { x: 1.5, y: 0.5 },
        gridStep: '0.5',
      };
      const result = service.calculatePlotSizeMm(plot);

      expect(result.width).toBeCloseTo(13 * 5 + 15, 5);
    });

    it('should produce equal dimensions for square plots whose axis scales differ', () => {
      const plot: Plot = {
        ...basePlot,
        squarePlots: true,
        range: { x: { min: 9, max: 20 }, y: { min: 0, max: 200 } },
        unitsPerSquare: { x: 1, y: 20 },
        gridStep: '0.5',
      };
      const result = service.calculatePlotSizeMm(plot);

      expect(result.width).toBeCloseTo(result.height, 5);
      expect(result.width).toBeCloseTo(11 * 5 + 15, 5);
    });

    it('should size a partial square according to the snapping mode', () => {
      const extended = service.calculatePlotSizeMm({
        ...basePlot,
        range: { x: { min: -3, max: 3 }, y: { min: 0, max: 150 } },
        unitsPerSquare: { x: 0.5, y: 20 },
        gridStep: '0.5',
      });
      const shrunk = service.calculatePlotSizeMm({
        ...basePlot,
        range: { x: { min: -3, max: 3 }, y: { min: 0, max: 150 } },
        unitsPerSquare: { x: 0.5, y: 20 },
        axisSnapping: { x: 'extend', y: 'shrink' },
        gridStep: '0.5',
      });

      expect(extended.height).toBeCloseTo(8 * 5 + 15, 5);
      expect(shrunk.height).toBeCloseTo(7 * 5 + 15, 5);
    });

    it('should produce equal dimensions for square plots with equal ranges', () => {
      const plot: Plot = {
        ...basePlot,
        squarePlots: true,
        range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
      };
      const result = service.calculatePlotSizeMm(plot);
      expect(result.width).toBeCloseTo(result.height, 5);
    });
  });
});
