import * as mathjs from 'mathjs';
import { EvalFunction, Matrix } from 'mathjs';
import { Injectable } from '@angular/core';
import { MathFunction, Plot } from '../../models/plot';
import {
  CleanedValues,
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
  ): Matrix[] | PlotGenerateErrorCode.evaluate {
    let yValues: Matrix[] | undefined;

    try {
      if (functions.length) {
        yValues = functions.map(expression =>
          valueRanges.x.map((x: number): number => expression.evaluate({ x })),
        );
      } else {
        yValues = [valueRanges.y];
      }
    } catch {
      return PlotGenerateErrorCode.evaluate;
    }

    return yValues;
  }

  createRanges(plot: Plot): ValueRanges {
    const x = mathjs.range(plot.range.x.min, plot.range.x.max, 0.1, true);
    const y = mathjs.range(plot.range.y.min, plot.range.y.max, 0.1, true);

    return {
      x,
      xNumbers: x.toArray() as number[],
      xMin: mathjs.min(x) as number,
      xMax: mathjs.max(x) as number,
      y,
      yNumbers: y.toArray() as number[],
      yMin: mathjs.min(y) as number,
      yMax: mathjs.max(y) as number,
    };
  }

  cleanUpValues(
    yValues: Matrix[],
    valueRanges: ValueRanges,
    plot: Plot,
  ): CleanedValues {
    let cleanXValues: number[] = [];
    let cleanYValues: number[][] = yValues.map(() => []);
    const xValuesArray = valueRanges.xNumbers;
    const yValuesArray = yValues.map(y => y.toArray() as number[]);

    if (plot.fnx.length) {
      for (let i = 0; i < yValuesArray.length; i++) {
        for (let ii = 0; ii < yValuesArray[i].length; ii++) {
          const y = yValuesArray[i][ii];
          if (y >= plot.range.y.min && y <= plot.range.y.max) {
            cleanXValues.push(xValuesArray[ii]);
            cleanYValues[i].push(yValuesArray[i][ii]);
          }
        }
      }
    } else {
      cleanXValues = valueRanges.xNumbers;
      cleanYValues = [yValues[0].toArray() as number[]];
    }
    return { cleanXValues, cleanYValues, xValuesArray, yValuesArray };
  }
}
