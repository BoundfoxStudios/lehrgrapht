import * as mathjs from 'mathjs';
import { EvalFunction, Matrix } from 'mathjs';
import { inject, Injectable } from '@angular/core';
import Plotly, { Annotations, PlotData } from 'plotly.js-dist-min';
import { AreaPoint, LabelPosition, MathFunction, Plot, PlotSettings } from '../models/plot';
import { MarkerNamingService } from './marker-naming.service';
import { modelIdPrefix } from './word/word.service';
import { v7 } from 'uuid';

export enum PlotGenerateErrorCode {
  /**
   * Happens during the compilation of the math expressions.
   */
  compile,

  /**
   * Happens during the evalution of the compiled math expressions.
   */
  evaluate,

  /**
   * Happens during plot generation.
   */
  plot,
}

export const plotHasErrorCode = (
  plot: unknown,
): plot is PlotGenerateErrorCode => {
  return (
    plot === PlotGenerateErrorCode.compile ||
    plot === PlotGenerateErrorCode.evaluate ||
    plot === PlotGenerateErrorCode.plot
  );
};

interface ValueRanges {
  x: Matrix;
  xNumbers: number[];
  xMin: number;
  xMax: number;
  y: Matrix;
  yNumbers: number[];
  yMin: number;
  yMax: number;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mmToInches = 1 / 25.4;
const mmToPoints = 72 / 25.4;
const devicePixelRatio = window.devicePixelRatio || 1;
const ppiBase = 96;
const effectiveDpi = 254 * devicePixelRatio; // MacBookPro dpi
const scaleFactor = effectiveDpi / 96;
const dtick = 0.5;
const mmPerTick = 5;
const mmMargin = {
  t: 7.5,
  b: 7.5,
  l: 7.5,
  r: 7.5,
};

@Injectable({ providedIn: 'root' })
export class PlotService {
  private readonly markerNamingService = inject(MarkerNamingService);

  async generate(
    plot: Plot,
    plotSettings: PlotSettings,
    options: {
      applyScaleFactor: boolean;
    },
  ): Promise<
    | {
        base64: string;
        widthInPx: number;
        heightInPx: number;
        widthInPoints: number;
        heightInPoints: number;
      }
    | PlotGenerateErrorCode
  > {
    const expressions = this.compileExpressions(plot.fnx);

    if (expressions === PlotGenerateErrorCode.compile) {
      return PlotGenerateErrorCode.compile;
    }

    const valueRanges = this.createRanges(plot);
    const yValues = this.evaluateExpressions(expressions, valueRanges);

    if (yValues === PlotGenerateErrorCode.evaluate) {
      return PlotGenerateErrorCode.evaluate;
    }

    const { cleanXValues, cleanYValues, xValuesArray, yValuesArray } =
      this.cleanUpValues(yValues, valueRanges, plot);

    const xValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanXValues
      : valueRanges.xNumbers;
    const xValueMin = mathjs.min(xValueFlat);
    const xValueMax = mathjs.max(xValueFlat);
    const xValueRange = xValueMax - xValueMin;

    const yValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanYValues.flatMap(y => y)
      : valueRanges.yNumbers;
    const yValueFlatMin = mathjs.min(yValueFlat);
    const yValueFlatMax = mathjs.max(yValueFlat);
    const yValueRange = yValueFlatMax - yValueFlatMin;

    const tickSquares = {
      x: plot.squarePlots
        ? Math.max(xValueRange, yValueRange) / dtick
        : xValueRange / dtick,
      y: plot.squarePlots
        ? Math.max(xValueRange, yValueRange) / dtick
        : yValueRange / dtick,
    };

    const plotSizeMm = {
      width:
        tickSquares.x * mmPerTick +
        (mmMargin.l + mmMargin.r + mmMargin.t + mmMargin.b) / 2,
      height:
        tickSquares.y * mmPerTick +
        (mmMargin.l + mmMargin.r + mmMargin.t + mmMargin.b) / 2,
    };

    const plotSizePx = {
      width: plotSizeMm.width * mmToInches * ppiBase,
      height: plotSizeMm.height * mmToInches * ppiBase,
    };

    const plotSizePoints = {
      width: plotSizeMm.width * mmToPoints,
      height: plotSizeMm.height * mmToPoints,
    };

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
      // x-labels.
      ...xAnnotationRange.slice(1, xAnnotationRange.length - 1).map(x => ({
        x,
        y: 0,
        text: `${x}`,
        xref: 'x',
        yref: 'y',
        showarrow: false,
        xanchor: 'center',
        yanchor: 'top',
        yshift: -2,
        xshift: x === 0 ? 6 : undefined,
        font: {
          size: 10,
        },
      })),
      // x-tick lines, remove the line that would be placed next to the x-axis arrow.
      ...xAnnotationRange
        .slice(0, xAnnotationRange.length - 1)
        .filter(x => x !== 0)
        .map(x => ({
          x,
          y: 0,
          xref: 'x',
          yref: 'y',
          showarrow: true,
          xanchor: 'center',
          yanchor: 'top',
          ax: 0,
          ay: 4 * plotSettings.zeroLineWidth,
          yshift: 2 * plotSettings.zeroLineWidth,
          arrowhead: 0,
          arrowwidth: plotSettings.zeroLineWidth,
        })),
      // y-tick lines.
      ...yAnnotationRange.slice(1, yAnnotationRange.length - 1).map(y => ({
        x: 0,
        y,
        text: `${y}`,
        xref: 'x',
        yref: 'y',
        xshift: -4,
        showarrow: false,
        xanchor: 'right',
        yanchor: 'center',
        font: {
          size: 10,
        },
      })),
      // y-tick lines, remove the line that would be placed next to the y-axis arrow.
      ...yAnnotationRange
        .slice(0, yAnnotationRange.length - 1)
        .filter(y => y !== 0)
        .map(y => ({
          x: 0,
          y,
          xref: 'x',
          yref: 'y',
          showarrow: true,
          xanchor: 'left',
          yanchor: 'middle',
          ax: 4 * plotSettings.zeroLineWidth,
          xshift: -2 * plotSettings.zeroLineWidth,
          ay: 0,
          arrowhead: 0,
          arrowwidth: plotSettings.zeroLineWidth,
        })),
    ] as Partial<Annotations>[];

    const arrows = [
      {
        x: xValueMax,
        y: 0,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: -20,
        ay: 0,
        arrowwidth: plotSettings.zeroLineWidth,
        arrowhead: 2,
        arrowcolor: plotSettings.zeroLineColor,
      },
      {
        x: 0,
        y: yValueFlatMax,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: 0,
        ay: 20,
        arrowwidth: plotSettings.zeroLineWidth,
        arrowhead: 2,
        arrowcolor: plotSettings.zeroLineColor,
      },
    ] as Partial<Annotations>[];

    if (plot.showAxisLabels) {
      arrows.push(
        {
          x: 0.1,
          y: 1.01,
          text: plot.axisLabelY || 'y',
          showarrow: false,
          yanchor: 'top',
          xanchor: 'left',
          xref: 'x',
          yref: 'paper',
        },
        {
          x: 1,
          y: 0.55,
          text: plot.axisLabelX || 'x',
          showarrow: false,
          yanchor: 'top',
          xanchor: 'right',
          xref: 'paper',
          yref: 'y',
        },
      );
    }

    const data: Partial<PlotData>[] = [];

    if (plot.fnx.length) {
      data.push(
        ...(yValuesArray.map((y, i) => ({
          type: 'scatter',
          x: xValuesArray,
          y,
          line: {
            color: plot.fnx[i].color,
            width: plotSettings.plotLineWidth,
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

    if (plot.lines.length) {
      data.push(
        ...plot.lines.map<Partial<PlotData>>(line => ({
          type: 'scatter',
          mode: 'lines',
          fill: 'none',
          x: [line.x1, line.x2],
          y: [line.y1, line.y2],
          line: {
            color: line.color,
            width: plotSettings.plotLineWidth,
          },
        })),
      );
    }

    if (plot.areas.length) {
      data.push(
        ...plot.areas.map<Partial<PlotData>>(area => ({
          type: 'scatter',
          mode: 'lines',
          fillcolor: hexToRgba(area.color, 0.7),
          fill: 'toself',
          x: [...area.points, area.points[0]].map(point => point.x),
          y: [...area.points, area.points[0]].map(point => point.y),
          line: {
            width: plotSettings.zeroLineWidth,
            color: plotSettings.zeroLineColor,
          },
        })),
      );

      const areaPointMarkers: {
        x: number;
        y: number;
        text: string;
        textposition: Exclude<LabelPosition, 'auto'>;
      }[] = [];
      for (const area of plot.areas) {
        if (area.showPoints) {
          for (const point of area.points) {
            const position =
              point.labelPosition !== 'auto'
                ? point.labelPosition
                : this.calculateLabelPosition(point, area.points);
            areaPointMarkers.push({
              x: point.x,
              y: point.y,
              text: point.labelText,
              textposition: position,
            });
          }
        }
      }

      if (areaPointMarkers.length) {
        const groupedByPosition = new Map<
          Exclude<LabelPosition, 'auto'>,
          typeof areaPointMarkers
        >();

        for (const marker of areaPointMarkers) {
          const existing = groupedByPosition.get(marker.textposition);
          if (existing) {
            existing.push(marker);
          } else {
            groupedByPosition.set(marker.textposition, [marker]);
          }
        }

        for (const [position, markers] of groupedByPosition) {
          data.push({
            type: 'scatter',
            mode: 'text+markers',
            x: markers.map(m => m.x),
            y: markers.map(m => m.y),
            text: markers.map(m => m.text),
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
            textposition: position,
          });
        }
      }
    }

    try {
      const image = await Plotly.toImage(
        {
          layout: {
            autosize: false,
            showlegend: false,
            width: plotSizePx.width,
            height: plotSizePx.height,
            annotations: !plot.showAxis
              ? undefined
              : plot.showAxisLabels && plot.placeAxisLabelsInside
                ? [...annotations, ...arrows]
                : arrows,
            margin: {
              t: mmMargin.t * mmToInches * ppiBase,
              b: mmMargin.b * mmToInches * ppiBase,
              l: mmMargin.l * mmToInches * ppiBase,
              r: mmMargin.r * mmToInches * ppiBase,
            },
            xaxis: {
              range: [xValueMin, xValueMax],
              autorange: false,
              showticklabels:
                plot.showAxisLabels && !plot.placeAxisLabelsInside,
              tickmode: 'linear',
              dtick,
              scaleanchor: 'y',
              ticklabelstep: 2,
              gridcolor: plotSettings.gridLineColor,
              gridwidth: plotSettings.gridLineWidth,
              tickfont: {
                size: 10,
              },
              zeroline: plot.showAxis,
              zerolinewidth: plotSettings.zeroLineWidth,
              zerolinecolor: plotSettings.zeroLineColor,
              linewidth: plotSettings.gridLineWidth,
              linecolor: plotSettings.gridLineColor,
              mirror: true,
            },
            yaxis: {
              range: [yValueFlatMin, yValueFlatMax],
              autorange: false,
              tickmode: 'linear',
              showticklabels:
                plot.showAxisLabels && !plot.placeAxisLabelsInside,
              dtick,
              ticklabelstep: 2,
              gridcolor: plotSettings.gridLineColor,
              gridwidth: plotSettings.gridLineWidth,
              tickfont: {
                size: 10,
              },
              zeroline: plot.showAxis,
              zerolinewidth: plotSettings.zeroLineWidth,
              zerolinecolor: plotSettings.zeroLineColor,
              linewidth: plotSettings.gridLineWidth,
              linecolor: plotSettings.gridLineColor,
              mirror: true,
            },
          },
          config: {
            staticPlot: true,
          },
          data,
        },
        {
          format: 'png',
          width: plotSizePx.width,
          height: plotSizePx.height,
          scale: options.applyScaleFactor ? scaleFactor : undefined,
        },
      );

      return {
        base64: image,
        widthInPx: plotSizePx.width,
        heightInPx: plotSizePx.height,
        widthInPoints: plotSizePoints.width,
        heightInPoints: plotSizePoints.height,
      };
    } catch {
      return PlotGenerateErrorCode.plot;
    }
  }

  private cleanUpValues(
    yValues: Matrix[],
    valueRanges: ValueRanges,
    plot: Plot,
  ): {
    cleanXValues: number[];
    cleanYValues: number[][];
    xValuesArray: number[];
    yValuesArray: number[][];
  } {
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

  generateId(): string {
    return `${modelIdPrefix}${v7()}`;
  }

  extractRawPictureDataFromBase64Picture(base64Picture: string): string {
    return base64Picture.substring('data:image/png;base64,'.length);
  }

  private createRanges(plot: Plot): ValueRanges {
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

  private compileExpressions(
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

  private evaluateExpressions(
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

  private calculateLabelPosition(
    point: AreaPoint,
    polygonPoints: AreaPoint[],
  ): Exclude<LabelPosition, 'auto'> {
    const centroid = {
      x: polygonPoints.reduce((sum, p) => sum + p.x, 0) / polygonPoints.length,
      y: polygonPoints.reduce((sum, p) => sum + p.y, 0) / polygonPoints.length,
    };

    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle >= -22.5 && angle < 22.5) return 'middle right';
    if (angle >= 22.5 && angle < 67.5) return 'top right';
    if (angle >= 67.5 && angle < 112.5) return 'top center';
    if (angle >= 112.5 && angle < 157.5) return 'top left';
    if (angle >= 157.5 || angle < -157.5) return 'middle left';
    if (angle >= -157.5 && angle < -112.5) return 'bottom left';
    if (angle >= -112.5 && angle < -67.5) return 'bottom center';
    return 'bottom right';
  }
}
