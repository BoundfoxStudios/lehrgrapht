import { Plot } from '../../models/plot';
import { CleanedValues, PLOT_CONSTANTS, ValueRanges } from './plot.types';
import { PlotSizeService } from './plot-size.service';
import * as mathjs from 'mathjs';

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
        fnx: [{ fnx: 'x^2', color: '#000', legendPosition: 'none' }],
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
        fnx: [{ fnx: 'x', color: '#000', legendPosition: 'start' }],
      };
      const margin = service.calculateEffectiveMargin(plot);
      expect(margin.l).toBeGreaterThanOrEqual(PLOT_CONSTANTS.mmMargin.l);
    });
  });

  describe('calculatePlotSize', () => {
    it('should calculate size in px and points', () => {
      const xNumbers = mathjs.range(-5, 5, 0.1, true).toArray() as number[];
      const yNumbers = mathjs.range(-5, 5, 0.1, true).toArray() as number[];

      const cleanedValues: CleanedValues = {
        cleanXValues: xNumbers,
        cleanYValues: [yNumbers],
        xValuesArray: xNumbers,
        yValuesArray: [yNumbers],
      };

      const valueRanges: ValueRanges = {
        x: mathjs.range(-5, 5, 0.1, true),
        xNumbers,
        xMin: -5,
        xMax: 5,
        y: mathjs.range(-5, 5, 0.1, true),
        yNumbers,
        yMin: -5,
        yMax: 5,
      };

      const margin = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };
      const result = service.calculatePlotSize(
        basePlot,
        cleanedValues,
        valueRanges,
        margin,
      );

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
      const xNumbers = mathjs.range(-2, 2, 0.1, true).toArray() as number[];
      const yNumbers = mathjs.range(-5, 5, 0.1, true).toArray() as number[];

      const cleanedValues: CleanedValues = {
        cleanXValues: xNumbers,
        cleanYValues: [yNumbers],
        xValuesArray: xNumbers,
        yValuesArray: [yNumbers],
      };
      const valueRanges: ValueRanges = {
        x: mathjs.range(-2, 2, 0.1, true),
        xNumbers,
        xMin: -2,
        xMax: 2,
        y: mathjs.range(-5, 5, 0.1, true),
        yNumbers,
        yMin: -5,
        yMax: 5,
      };
      const margin = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };
      const result = service.calculatePlotSize(
        plot,
        cleanedValues,
        valueRanges,
        margin,
      );

      expect(result.plotSizePx.width).toBeCloseTo(result.plotSizePx.height, 5);
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
