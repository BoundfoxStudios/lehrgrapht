import { PlotRange } from '../models/plot-range';
import * as mathjs from 'mathjs';
import { EvalFunction } from 'mathjs';
import { Injectable } from '@angular/core';
import Plotly, { Annotations } from 'plotly.js-dist-min';

export interface MathFunction {
  fnx: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class PlotService {
  async generate({
    fnx,
    range,
    showAxisLabels,
    placeAxisLabelsInside,
  }: {
    fnx: MathFunction[];
    range: PlotRange;
    showAxisLabels: boolean;
    placeAxisLabelsInside: boolean;
  }): Promise<
    | {
        base64: string;
        widthInPx: number;
        heightInPx: number;
        widthInPoints: number;
        heightInPoints: number;
      }
    | undefined
  > {
    const expressions: EvalFunction[] = [];

    try {
      for (const f of fnx) {
        const expression = mathjs.compile(f.fnx);
        expressions.push(expression);
      }
    } catch {
      return;
    }

    if (expressions.length !== fnx.length) {
      return;
    }

    const xValues = mathjs.range(range.x.min, range.x.max, 0.1, true);
    const yValues = expressions.map(expression =>
      xValues.map((x: number): number => expression.evaluate({ x })),
    );

    const mmToInches = 1 / 25.4;
    const mmToPoints = 72 / 25.4; // points per mm (1 point = 1/72 inch)
    const dpr = window.devicePixelRatio || 1;
    const ppiBase = 96; // logical PPI for layout sizing in Plotly
    const effectiveDpi = 254 * dpr;
    const scaleFactor = effectiveDpi / 96;

    const cleanXValues: number[] = [];
    const cleanYValues: number[][] = yValues.map(() => []);
    const xValuesArray = xValues.toArray() as number[];
    const yValuesArray = yValues.map(y => y.toArray() as number[]);

    for (let i = 0; i < yValuesArray.length; i++) {
      for (let ii = 0; ii < yValuesArray[i].length; ii++) {
        const y = yValuesArray[i][ii];
        if (y >= range.y.min && y <= range.y.max) {
          cleanXValues.push(xValuesArray[ii]);
          cleanYValues[i].push(yValuesArray[i][ii]);
        }
      }
    }

    console.log({ cleanXValues, cleanYValues });

    const valueRange = Math.max(...cleanXValues) - Math.min(...cleanXValues);
    const yValueFlat = cleanYValues.flatMap(y => y);
    const yValueFlatMin = Math.min(...yValueFlat);
    const yValueFlatMax = Math.max(...yValueFlat);
    const yValueRange = yValueFlatMax - yValueFlatMin;

    const dtick = 0.5;
    const mmPerTick = 5;
    const mmMargin = {
      t: 7.5,
      b: 7.5,
      l: 7.5,
      r: 7.5,
    };

    const numTickSquares = Math.max(valueRange, yValueRange) / dtick;
    const plotSizeMm =
      numTickSquares * mmPerTick +
      (mmMargin.t + mmMargin.b + mmMargin.l + mmMargin.r) / 2;
    const plotSizePx = plotSizeMm * mmToInches * ppiBase;

    const plotSizePoints = plotSizeMm * mmToPoints;

    const xAnnotationRange = mathjs
      .range(range.x.min, range.x.max, 1, true)
      .toArray() as number[];

    let yAnnotationRange = mathjs
      .range(range.y.min, range.y.max, 1, true)
      .toArray() as number[];

    if (xAnnotationRange.includes(0) && yAnnotationRange.includes(0)) {
      yAnnotationRange = yAnnotationRange.filter(y => y !== 0);
    }

    const annotations = [
      ...xAnnotationRange.map(x => ({
        x,
        y: 0,
        text: `${x}`,
        xref: 'x',
        yref: 'y',
        showarrow: false,
        xanchor: 'center',
        yanchor: 'top',
        font: {
          size: 10,
        },
      })),
      ...yAnnotationRange.map(y => ({
        x: 0,
        y,
        text: `${y}`,
        xref: 'x',
        yref: 'y',
        showarrow: false,
        xanchor: 'right',
        yanchor: 'center',
        font: {
          size: 10,
        },
      })),
    ] as Partial<Annotations>[];

    const arrows = [
      {
        x: 0.535,
        y: 0.94,
        text: 'y',
        showarrow: false,
        yanchor: 'bottom',
        xanchor: 'center',
        xref: 'paper',
        yref: 'paper',
      },
      {
        x: 0.96,
        y: 0.49,
        text: 'x',
        showarrow: false,
        yanchor: 'top',
        xanchor: 'left',
        xref: 'paper',
        yref: 'paper',
      },
      {
        x: Math.max(...cleanXValues),
        y: 0,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: -20,
        ay: 0,
        arrowwidth: 1,
        arrowsize: 1.5,
        arrowhead: 5,
      },
      {
        x: 0,
        y: yValueFlatMax,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: 0,
        ay: 20,
        arrowwidth: 1,
        arrowsize: 1.5,
        arrowhead: 5,
      },
    ] as Partial<Annotations>[];

    const image = await Plotly.toImage(
      {
        layout: {
          autosize: false,
          showlegend: false,
          width: plotSizePx,
          height: plotSizePx,
          annotations:
            showAxisLabels && placeAxisLabelsInside
              ? [...annotations, ...arrows]
              : arrows,
          margin: {
            t: mmMargin.t * mmToInches * ppiBase,
            b: mmMargin.b * mmToInches * ppiBase,
            l: mmMargin.l * mmToInches * ppiBase,
            r: mmMargin.r * mmToInches * ppiBase,
          },
          xaxis: {
            range: [Math.min(...cleanXValues), Math.max(...cleanXValues)],
            autorange: false,
            showticklabels: showAxisLabels && !placeAxisLabelsInside,
            tickmode: 'linear',
            dtick: 0.5,
            scaleanchor: 'y',
            ticklabelstep: 2,
            gridcolor: '#a6a6a6',
            tickfont: {
              size: 10,
            },
          },
          yaxis: {
            range: [yValueFlatMin, yValueFlatMax],
            autorange: false,
            tickmode: 'linear',
            showticklabels: showAxisLabels && !placeAxisLabelsInside,
            dtick: 0.5,
            ticklabelstep: 2,
            gridcolor: '#a6a6a6',
            tickfont: {
              size: 10,
            },
          },
        },
        config: {
          staticPlot: true,
        },
        data: yValuesArray.map((y, i) => ({
          type: 'scatter',
          x: xValuesArray,
          y,
          line: {
            color: fnx[i].color,
          },
        })),
      },
      {
        format: 'png',
        width: plotSizePx,
        height: plotSizePx,
        scale: scaleFactor,
      },
    );

    return {
      base64: image,
      widthInPx: plotSizePx,
      heightInPx: plotSizePx,
      widthInPoints: plotSizePoints,
      heightInPoints: plotSizePoints,
    };
  }
}
