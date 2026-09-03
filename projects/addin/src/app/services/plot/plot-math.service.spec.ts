import { Plot } from '../../models/plot';
import { FunctionSeries, PlotGenerateErrorCode } from './plot.types';
import { PlotMathService } from './plot-math.service';
import type { EvalFunction } from 'mathjs';

const basePlot: Plot = {
  version: '1.0',
  name: 'test',
  range: { x: { min: -5, max: 5 }, y: { min: -5, max: 5 } },
  unitsPerSquare: { x: 0.5, y: 0.5 },
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

describe('PlotMathService', () => {
  const service = new PlotMathService();

  describe('compileExpressions', () => {
    it('should compile valid expressions', () => {
      const result = service.compileExpressions([
        {
          fnx: 'x^2',
          color: '#000',
          legendPosition: 'end',
          lineStyle: 'solid',
        },
      ]);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(1);
    });

    it('should compile multiple expressions', () => {
      const result = service.compileExpressions([
        {
          fnx: 'x^2',
          color: '#000',
          legendPosition: 'end',
          lineStyle: 'solid',
        },
        {
          fnx: 'sin(x)',
          color: '#f00',
          legendPosition: 'start',
          lineStyle: 'solid',
        },
      ]);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(2);
    });

    it('should return compile error for invalid expressions', () => {
      const result = service.compileExpressions([
        {
          fnx: '???invalid',
          color: '#000',
          legendPosition: 'end',
          lineStyle: 'solid',
        },
      ]);
      expect(result).toBe(PlotGenerateErrorCode.compile);
    });

    it('should return empty array for no functions', () => {
      const result = service.compileExpressions([]);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(0);
    });
  });

  describe('evaluateExpressions', () => {
    const sampleFunction = (
      fnx: string,
      xMin: number,
      xMax: number,
      yRange: Plot['range']['y'] = basePlot.range.y,
    ): { series: FunctionSeries; xNumbers: number[] } => {
      const compiled = service.compileExpressions([
        { fnx, color: '#000', legendPosition: 'end', lineStyle: 'solid' },
      ]);
      const ranges = service.createRanges({
        ...basePlot,
        range: { x: { min: xMin, max: xMax }, y: yRange },
      });
      const result = service.evaluateExpressions(
        compiled as EvalFunction[],
        ranges,
      );
      expect(Array.isArray(result)).toBe(true);
      return {
        series: (result as FunctionSeries[])[0],
        xNumbers: ranges.xNumbers,
      };
    };

    it('should evaluate compiled expressions over a range', () => {
      const { series, xNumbers } = sampleFunction('x^2', -5, 5);

      const zeroIdx = xNumbers.findIndex(x => Math.abs(x) < 0.001);
      expect(zeroIdx).toBeGreaterThanOrEqual(0);
      expect(series.y[zeroIdx]).toBeCloseTo(0);
    });

    it('should return no series when no functions are provided', () => {
      const ranges = service.createRanges(basePlot);
      const result = service.evaluateExpressions([], ranges);
      expect(result).toEqual([]);
    });

    it('should return evaluate error for expressions that fail at runtime', () => {
      const compiled = service.compileExpressions([
        { fnx: 'y', color: '#000', legendPosition: 'end', lineStyle: 'solid' },
      ]);
      expect(Array.isArray(compiled)).toBe(true);

      const result = service.evaluateExpressions(
        compiled as EvalFunction[],
        service.createRanges(basePlot),
      );
      expect(result).toBe(PlotGenerateErrorCode.evaluate);
    });

    it('should insert a gap at the pole of 12/x', () => {
      const { series, xNumbers } = sampleFunction('12/x', -3, 3);

      expect(series.y.filter(value => value === null)).toHaveLength(1);
      expect(series.x).toHaveLength(series.y.length);
      expect(series.y).toHaveLength(xNumbers.length + 1);
      expect(Math.abs(series.x[series.y.indexOf(null)])).toBeLessThan(0.1);
    });

    it('should insert a gap at the pole of a vertically shifted hyperbola', () => {
      const { series } = sampleFunction('1/x + 11', -3, 3);

      expect(series.y.filter(value => value === null)).toHaveLength(1);
      expect(Math.abs(series.x[series.y.indexOf(null)])).toBeLessThan(0.1);
    });

    it('should insert a gap at the pole of a downward shifted hyperbola', () => {
      const { series } = sampleFunction('11 - 1/x', -5, 5);

      expect(series.y.filter(value => value === null)).toHaveLength(1);
      expect(Math.abs(series.x[series.y.indexOf(null)])).toBeLessThan(0.1);
    });

    it('should insert a gap at a pole between two grid points of a shifted hyperbola', () => {
      const { series } = sampleFunction('1/(4x-1) + 6', -3, 3, {
        min: -6,
        max: 6,
      });

      expect(series.y.filter(value => value === null)).toHaveLength(1);
      const gapX = series.x[series.y.indexOf(null)];
      expect(gapX).toBeGreaterThan(0.2);
      expect(gapX).toBeLessThan(0.3);
    });

    it('should insert a gap when the pole sits on a sample midpoint', () => {
      const { series, xNumbers } = sampleFunction('1/(x-0.05)', 0, 3);

      expect(series.y.filter(value => value === null)).toHaveLength(1);
      expect(series.x[series.y.indexOf(null)]).toBeCloseTo(0.05);
      expect(series.y).toHaveLength(xNumbers.length + 1);
    });

    it('should turn a division by zero into a gap', () => {
      const { series, xNumbers } = sampleFunction('12/x', 0, 3);

      expect(series.y[0]).toBeNull();
      expect(series.y.filter(value => value === null)).toHaveLength(1);
      expect(series.y).toHaveLength(xNumbers.length);
    });

    it('should insert a gap at the asymptote of tan(x)', () => {
      const { series } = sampleFunction('tan(x)', 0, 3);

      expect(series.y.filter(value => value === null)).toHaveLength(1);
      const gapX = series.x[series.y.indexOf(null)];
      expect(gapX).toBeGreaterThan(1.5);
      expect(gapX).toBeLessThan(1.6);
    });

    it('should not insert a gap for a steep zero crossing', () => {
      const { series, xNumbers } = sampleFunction('100*x', -3, 3);

      expect(series.y).not.toContain(null);
      expect(series.y).toHaveLength(xNumbers.length);
    });

    it('should not insert a gap when a sample is exactly zero', () => {
      const { series } = sampleFunction('x - 10x^2', 0, 3);

      expect(series.y).not.toContain(null);
    });

    it('should not insert a gap between two adjacent roots', () => {
      const { series } = sampleFunction('(x-2)(x-2.1)', 0, 3);

      expect(series.y).not.toContain(null);
    });

    it('should turn complex results into gaps', () => {
      const { series, xNumbers } = sampleFunction('sqrt(x)', -3, 3);

      expect(series.y).toHaveLength(xNumbers.length);
      for (let index = 0; index < series.x.length; index++) {
        expect(series.y[index] === null).toBe(series.x[index] < 0);
      }
    });

    it('should evaluate ln and lg through the shared math instance', () => {
      const ln = sampleFunction('ln(x)', 1, 3);
      const lg = sampleFunction('lg(x)', 1, 10);

      expect(ln.series.y[0]).toBeCloseTo(0);
      expect(lg.series.y[lg.series.y.length - 1]).toBeCloseTo(1);
    });

    it('should turn ln of a non-positive argument into gaps', () => {
      const { series, xNumbers } = sampleFunction('ln(x)', -3, 3);

      expect(series.y).toHaveLength(xNumbers.length);
      for (let index = 0; index < series.x.length; index++) {
        expect(series.y[index] === null).toBe(series.x[index] <= 0);
      }
    });

    it('should turn ln of a complex intermediate value into gaps', () => {
      const { series } = sampleFunction('ln(sqrt(x))', -3, 3);

      for (let index = 0; index < series.x.length; index++) {
        expect(series.y[index] === null).toBe(series.x[index] <= 0);
      }
    });
  });

  describe('createRanges', () => {
    it('should create ranges from plot config', () => {
      const ranges = service.createRanges(basePlot);

      expect(ranges.yMin).toBeCloseTo(-5);
      expect(ranges.yMax).toBeCloseTo(5);
      expect(ranges.xNumbers.length).toBeGreaterThan(0);
      expect(ranges.yNumbers.length).toBeGreaterThan(0);
    });

    it('should include endpoints', () => {
      const ranges = service.createRanges(basePlot);
      expect(ranges.xNumbers[0]).toBeCloseTo(-5);
      expect(ranges.xNumbers[ranges.xNumbers.length - 1]).toBeCloseTo(5);
    });
  });

  describe('cleanUpValues', () => {
    it('should filter y values outside the plot range', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: -2, max: 2 }, y: { min: 0, max: 4 } },
        fnx: [
          {
            fnx: 'x^2',
            color: '#000',
            legendPosition: 'end',
            lineStyle: 'solid',
          },
        ],
      };
      const ranges = service.createRanges(plot);
      const compiled = service.compileExpressions(plot.fnx);
      const yValues = service.evaluateExpressions(
        compiled as EvalFunction[],
        ranges,
      );

      const result = service.cleanUpValues(
        yValues as FunctionSeries[],
        ranges,
        plot,
      );

      for (const y of result.cleanYValues[0]) {
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(4);
      }
    });

    it('should return full range when no functions', () => {
      const plot: Plot = { ...basePlot, fnx: [] };
      const ranges = service.createRanges(plot);
      const yValues = service.evaluateExpressions([], ranges);

      const result = service.cleanUpValues(
        yValues as FunctionSeries[],
        ranges,
        plot,
      );
      expect(result.cleanXValues.length).toBe(ranges.xNumbers.length);
    });

    it('should skip gaps', () => {
      const result = service.cleanUpValues(
        [{ x: [0, 0.5, 1, 2], y: [1, null, 3, 20] }],
        service.createRanges(basePlot),
        basePlot,
      );

      expect(result.cleanYValues).toEqual([[1, 3]]);
      expect(result.cleanXValues).toEqual([0, 1]);
    });
  });
});
