import * as mathjs from 'mathjs';
import { EvalFunction } from 'mathjs';
import { Injectable } from '@angular/core';
import { MathFunction, Plot } from '../../models/plot';
import {
  CleanedValues,
  FunctionSeries,
  isFiniteNumber,
  PlotGenerateErrorCode,
  ValueRanges,
} from './plot.types';

@Injectable({ providedIn: 'root' })
export class PlotMathService {
  compileExpressions(
    fnx: MathFunction[],
  ): EvalFunction[] | PlotGenerateErrorCode.compile {
    const expressions: EvalFunction[] = [];

    try {
      for (const f of fnx) {
        const expression = mathjs.compile(f.fnx);
        expressions.push(expression);
      }
    } catch {
      return PlotGenerateErrorCode.compile;
    }

    return expressions;
  }

  evaluateExpressions(
    functions: EvalFunction[],
    valueRanges: ValueRanges,
  ): FunctionSeries[] | PlotGenerateErrorCode.evaluate {
    try {
      const yRange = valueRanges.yMax - valueRanges.yMin;
      return functions.map(expression =>
        this.sampleExpression(expression, valueRanges.xNumbers, yRange),
      );
    } catch {
      return PlotGenerateErrorCode.evaluate;
    }
  }

  createRanges(plot: Plot): ValueRanges {
    const xNumbers = mathjs
      .range(plot.range.x.min, plot.range.x.max, 0.1, true)
      .toArray() as number[];
    const yNumbers = mathjs
      .range(plot.range.y.min, plot.range.y.max, 0.1, true)
      .toArray() as number[];

    return {
      xNumbers,
      yNumbers,
      yMin: mathjs.min(yNumbers),
      yMax: mathjs.max(yNumbers),
    };
  }

  cleanUpValues(
    series: FunctionSeries[],
    valueRanges: ValueRanges,
    plot: Plot,
  ): CleanedValues {
    if (series.length === 0) {
      return {
        cleanXValues: valueRanges.xNumbers,
        cleanYValues: [valueRanges.yNumbers],
      };
    }

    const cleanXValues: number[] = [];
    const cleanYValues: number[][] = series.map(() => []);

    for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
      const functionSeries = series[seriesIndex];
      for (
        let sampleIndex = 0;
        sampleIndex < functionSeries.y.length;
        sampleIndex++
      ) {
        const y = functionSeries.y[sampleIndex];
        if (
          isFiniteNumber(y) &&
          y >= plot.range.y.min &&
          y <= plot.range.y.max
        ) {
          cleanXValues.push(functionSeries.x[sampleIndex]);
          cleanYValues[seriesIndex].push(y);
        }
      }
    }

    return { cleanXValues, cleanYValues };
  }

  private sampleExpression(
    expression: EvalFunction,
    xValues: number[],
    yRange: number,
  ): FunctionSeries {
    const evaluateAt = (x: number): number | null => {
      const value: unknown = expression.evaluate({ x });
      return isFiniteNumber(value) ? value : null;
    };
    const samples = xValues.map(evaluateAt);
    const x: number[] = [];
    const y: (number | null)[] = [];

    for (let index = 0; index < xValues.length; index++) {
      x.push(xValues[index]);
      y.push(samples[index]);

      if (index === xValues.length - 1) {
        continue;
      }

      const left = samples[index];
      const right = samples[index + 1];
      if (left === null || right === null) {
        continue;
      }

      const middleX = (xValues[index] + xValues[index + 1]) / 2;
      const middle = evaluateAt(middleX);
      const low = Math.min(left, right);
      const high = Math.max(left, right);
      const overshoot =
        middle === null ? Infinity : Math.max(low - middle, middle - high);
      const changesSign =
        left * right < 0 &&
        Math.min(Math.abs(left), Math.abs(right)) > yRange * 1e-9;
      // Poles leave the sample interval at the midpoint. Zero crossings stay inside; extrema between samples overshoot by far less than the plot height
      const isPole =
        overshoot > 0 &&
        (changesSign || high - low > yRange || overshoot > yRange);
      if (isPole) {
        x.push(middleX);
        y.push(null);
      }
    }

    return { x, y };
  }
}
