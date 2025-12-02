import * as mathjs from 'mathjs';
import { EvalFunction, Matrix } from 'mathjs';
import { Injectable } from '@angular/core';
import Plotly, { Annotations, PlotData } from 'plotly.js-dist-min';
import { Plot } from '../models/plot';

@Injectable({ providedIn: 'root' })
export class PlotService {
  async generate(plot: Plot): Promise<
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
      for (const f of plot.fnx) {
        const expression = mathjs.compile(f.fnx);
        expressions.push(expression);
      }
    } catch {
      return;
    }

    if (expressions.length !== plot.fnx.length) {
      return;
    }

    const xValues = mathjs.range(plot.range.x.min, plot.range.x.max, 0.1, true);
    let yValues: Matrix[] | undefined;

    try {
      if (plot.fnx.length) {
        yValues = expressions.map(expression =>
          xValues.map((x: number): number => expression.evaluate({ x })),
        );
      } else {
        yValues = [mathjs.range(plot.range.y.min, plot.range.y.max, 0.1, true)];
      }
    } catch {
      return;
    }

    const mmToInches = 1 / 25.4;
    const mmToPoints = 72 / 25.4;
    const dpr = window.devicePixelRatio || 1;
    const ppiBase = 96;
    const effectiveDpi = 254 * dpr; // 254 is MBP dpi
    const scaleFactor = effectiveDpi / 96;

    let cleanXValues: number[] = [];
    let cleanYValues: number[][] = yValues.map(() => []);
    const xValuesArray = xValues.toArray() as number[];
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
      cleanXValues = xValues.toArray() as number[];
      cleanYValues = [yValues[0].toArray() as number[]];
    }

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
      .range(plot.range.x.min, plot.range.x.max, 1, true)
      .toArray() as number[];

    let yAnnotationRange = mathjs
      .range(plot.range.y.min, plot.range.y.max, 1, true)
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
        x: 0.25,
        y: 1.01,
        text: 'y',
        showarrow: false,
        yanchor: 'top',
        xanchor: 'center',
        xref: 'x',
        yref: 'paper',
      },
      {
        x: 1,
        y: 0.55,
        text: 'x',
        showarrow: false,
        yanchor: 'top',
        xanchor: 'right',
        xref: 'paper',
        yref: 'y',
      },
      {
        x: 1,
        y: 0,
        showarrow: true,
        xref: 'paper',
        yref: 'y',
        ax: -20,
        ay: 0,
        arrowwidth: 1,
        arrowsize: 1.5,
        arrowhead: 5,
      },
      {
        x: 0,
        y: 1,
        showarrow: true,
        xref: 'x',
        yref: 'paper',
        ax: 0,
        ay: 20,
        arrowwidth: 1,
        arrowsize: 1.5,
        arrowhead: 5,
      },
    ] as Partial<Annotations>[];

    const data: Partial<PlotData>[] = [];

    if (plot.fnx.length) {
      data.push(
        ...(yValuesArray.map((y, i) => ({
          type: 'scatter',
          x: xValuesArray,
          y,
          line: {
            color: plot.fnx[i].color,
          },
        })) as Partial<PlotData>[]),
      );
    }

    if (plot.markers.length) {
      data.push({
        type: 'scatter',
        mode: 'text+markers',
        x: plot.markers.map(marker => marker.x),
        y: plot.markers.map(marker => marker.y),
        text: plot.markers.map(marker => marker.text),
        marker: {
          symbol: 'x-thin',
          color: '#000000',
          size: 10,
          line: {
            width: 1.5,
          },
        },
        textfont: {
          size: 12,
        },
        textposition: 'bottom left',
      });
    }

    const image = await Plotly.toImage(
      {
        layout: {
          autosize: false,
          showlegend: false,
          width: plotSizePx,
          height: plotSizePx,
          annotations:
            plot.showAxisLabels && plot.placeAxisLabelsInside
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
            showticklabels: plot.showAxisLabels && !plot.placeAxisLabelsInside,
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
            showticklabels: plot.showAxisLabels && !plot.placeAxisLabelsInside,
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
        data,
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
