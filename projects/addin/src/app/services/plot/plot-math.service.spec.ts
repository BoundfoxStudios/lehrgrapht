import { Plot } from '../../models/plot';
import { PlotGenerateErrorCode, ValueRanges } from './plot.types';
import { PlotMathService } from './plot-math.service';
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

describe('PlotMathService', () => {
  const service = new PlotMathService();

  describe('compileExpressions', () => {
    it('should compile valid expressions', () => {
      const result = service.compileExpressions([
        { fnx: 'x^2', color: '#000', legendPosition: 'end' },
      ]);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(1);
    });

    it('should compile multiple expressions', () => {
      const result = service.compileExpressions([
        { fnx: 'x^2', color: '#000', legendPosition: 'end' },
        { fnx: 'sin(x)', color: '#f00', legendPosition: 'start' },
      ]);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(2);
    });

    it('should return compile error for invalid expressions', () => {
      const result = service.compileExpressions([
        { fnx: '???invalid', color: '#000', legendPosition: 'end' },
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
    it('should evaluate compiled expressions over a range', () => {
      const compiled = service.compileExpressions([
        { fnx: 'x^2', color: '#000', legendPosition: 'end' },
      ]);
      expect(Array.isArray(compiled)).toBe(true);

      const ranges = service.createRanges({
        ...basePlot,
        fnx: [{ fnx: 'x^2', color: '#000', legendPosition: 'end' }],
      });
      const result = service.evaluateExpressions(
        compiled as mathjs.EvalFunction[],
        ranges,
      );
      expect(Array.isArray(result)).toBe(true);

      const yValues = (result as mathjs.Matrix[])[0].toArray() as number[];
      // x=0 should produce y=0 (find closest to 0 due to floating point)
      const zeroIdx = ranges.xNumbers.findIndex(x => Math.abs(x) < 0.001);
      expect(zeroIdx).toBeGreaterThanOrEqual(0);
      expect(yValues[zeroIdx]).toBeCloseTo(0);
    });

    it('should return y range when no functions are provided', () => {
      const ranges = service.createRanges(basePlot);
      const result = service.evaluateExpressions([], ranges);
      expect(Array.isArray(result)).toBe(true);
      expect((result as mathjs.Matrix[]).length).toBe(1);
    });

    it('should return evaluate error for expressions that fail at runtime', () => {
      const compiled = service.compileExpressions([
        { fnx: 'x', color: '#000', legendPosition: 'end' },
      ]);
      expect(Array.isArray(compiled)).toBe(true);

      const brokenRanges = {
        x: {
          map: () => {
            throw new Error('boom');
          },
        },
        y: mathjs.range(-5, 5, 0.1, true),
        xNumbers: [],
        xMin: -5,
        xMax: 5,
        yNumbers: [],
        yMin: -5,
        yMax: 5,
      } as unknown as ValueRanges;

      const result = service.evaluateExpressions(
        compiled as mathjs.EvalFunction[],
        brokenRanges,
      );
      expect(result).toBe(PlotGenerateErrorCode.evaluate);
    });
  });

  describe('createRanges', () => {
    it('should create ranges from plot config', () => {
      const ranges = service.createRanges(basePlot);

      expect(ranges.xMin).toBeCloseTo(-5);
      expect(ranges.xMax).toBeCloseTo(5);
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
        fnx: [{ fnx: 'x^2', color: '#000', legendPosition: 'end' }],
      };
      const ranges = service.createRanges(plot);
      const compiled = service.compileExpressions(plot.fnx);
      const yValues = service.evaluateExpressions(
        compiled as mathjs.EvalFunction[],
        ranges,
      );

      const result = service.cleanUpValues(
        yValues as mathjs.Matrix[],
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
        yValues as mathjs.Matrix[],
        ranges,
        plot,
      );
      expect(result.cleanXValues.length).toBe(ranges.xNumbers.length);
    });
  });
});
