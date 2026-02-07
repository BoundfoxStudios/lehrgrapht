import * as mathjs from 'mathjs';
import { EvalFunction, Matrix } from 'mathjs';
import { inject, Injectable } from '@angular/core';
import Plotly, { Annotations, PlotData } from 'plotly.js-dist-min';
import {
  AreaPoint,
  LabelPosition,
  MathFunction,
  Plot,
  PlotSettings,
} from '../models/plot';
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

export const A4_USABLE_WIDTH_MM = 180;
export const A4_USABLE_HEIGHT_MM = 267;

export interface PlotSizeMm {
  width: number;
  height: number;
  exceedsA4: boolean;
  exceedsWidth: boolean;
  exceedsHeight: boolean;
}

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

interface PlotSizeCalculation {
  xValueMin: number;
  xValueMax: number;
  yValueMin: number;
  yValueMax: number;
  plotSizePx: { width: number; height: number };
  plotSizePoints: { width: number; height: number };
}

interface CleanedValues {
  cleanXValues: number[];
  cleanYValues: number[][];
  xValuesArray: number[];
  yValuesArray: number[][];
}

interface PlotMarginMm {
  t: number;
  b: number;
  l: number;
  r: number;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PLOT_CONSTANTS = {
  mmToInches: 1 / 25.4,
  mmToPoints: 72 / 25.4,
  ppiBase: 96,
  dtick: 0.5,
  mmPerTick: 5,
  mmMargin: { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
} as const;

const devicePixelRatio = window.devicePixelRatio || 1;
const effectiveDpi = 254 * devicePixelRatio;
const scaleFactor = effectiveDpi / PLOT_CONSTANTS.ppiBase;

@Injectable({ providedIn: 'root' })
export class PlotService {
  private readonly markerNamingService = inject(MarkerNamingService);

  async generate(
    plot: Plot,
    plotSettings: PlotSettings,
    options: { applyScaleFactor: boolean },
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

    const cleanedValues = this.cleanUpValues(yValues, valueRanges, plot);
    const margin = this.calculateEffectiveMargin(plot);
    const sizeCalc = this.calculatePlotSize(
      plot,
      cleanedValues,
      valueRanges,
      margin,
    );
    const annotations = this.buildAnnotations(plot, plotSettings);
    const functionLabelImages = await this.buildFunctionLabelImages(
      plot,
      cleanedValues.xValuesArray,
      cleanedValues.yValuesArray,
      sizeCalc,
      margin,
    );
    const arrows = this.buildArrows(
      plot,
      plotSettings,
      sizeCalc.xValueMax,
      sizeCalc.yValueMax,
    );
    const data = this.buildPlotData(
      plot,
      plotSettings,
      cleanedValues.xValuesArray,
      cleanedValues.yValuesArray,
    );

    return this.renderPlot(
      plot,
      plotSettings,
      sizeCalc,
      margin,
      annotations,
      arrows,
      data,
      functionLabelImages,
      options.applyScaleFactor,
    );
  }

  private cleanUpValues(
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

  private calculatePlotSize(
    plot: Plot,
    cleanedValues: CleanedValues,
    valueRanges: ValueRanges,
    margin: PlotMarginMm,
  ): PlotSizeCalculation {
    const { dtick, mmPerTick, mmToInches, mmToPoints, ppiBase } =
      PLOT_CONSTANTS;

    const xValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanedValues.cleanXValues
      : valueRanges.xNumbers;
    const xValueMin = mathjs.min(xValueFlat);
    const xValueMax = mathjs.max(xValueFlat);
    const xValueRange = xValueMax - xValueMin;

    const yValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanedValues.cleanYValues.flatMap(y => y)
      : valueRanges.yNumbers;
    const yValueMin = mathjs.min(yValueFlat);
    const yValueMax = mathjs.max(yValueFlat);
    const yValueRange = yValueMax - yValueMin;

    const tickSquares = {
      x: plot.squarePlots
        ? Math.max(xValueRange, yValueRange) / dtick
        : xValueRange / dtick,
      y: plot.squarePlots
        ? Math.max(xValueRange, yValueRange) / dtick
        : yValueRange / dtick,
    };

    const plotSizeMm = {
      width: tickSquares.x * mmPerTick + margin.l + margin.r,
      height: tickSquares.y * mmPerTick + margin.t + margin.b,
    };

    return {
      xValueMin,
      xValueMax,
      yValueMin,
      yValueMax,
      plotSizePx: {
        width: plotSizeMm.width * mmToInches * ppiBase,
        height: plotSizeMm.height * mmToInches * ppiBase,
      },
      plotSizePoints: {
        width: plotSizeMm.width * mmToPoints,
        height: plotSizeMm.height * mmToPoints,
      },
    };
  }

  private buildAnnotations(
    plot: Plot,
    plotSettings: PlotSettings,
  ): Partial<Annotations>[] {
    const xAnnotationRange = mathjs
      .range(plot.range.x.min, plot.range.x.max, 1, true)
      .toArray() as number[];

    let yAnnotationRange = mathjs
      .range(plot.range.y.min, plot.range.y.max, 1, true)
      .toArray() as number[];

    if (xAnnotationRange.includes(0) && yAnnotationRange.includes(0)) {
      yAnnotationRange = yAnnotationRange.filter(y => y !== 0);
    }

    return [
      ...this.buildXLabels(xAnnotationRange),
      ...this.buildXTickLines(xAnnotationRange, plotSettings),
      ...this.buildYLabels(yAnnotationRange),
      ...this.buildYTickLines(yAnnotationRange, plotSettings),
    ];
  }

  private buildXLabels(xRange: number[]): Partial<Annotations>[] {
    return xRange.slice(1, xRange.length - 1).map(x => ({
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
      font: { size: 10 },
    }));
  }

  private buildXTickLines(
    xRange: number[],
    plotSettings: PlotSettings,
  ): Partial<Annotations>[] {
    return xRange
      .slice(0, xRange.length - 1)
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
      }));
  }

  private buildYLabels(yRange: number[]): Partial<Annotations>[] {
    return yRange.slice(1, yRange.length - 1).map(y => ({
      x: 0,
      y,
      text: `${y}`,
      xref: 'x',
      yref: 'y',
      xshift: -4,
      showarrow: false,
      xanchor: 'right',
      yanchor: 'middle',
      font: { size: 10 },
    }));
  }

  private buildYTickLines(
    yRange: number[],
    plotSettings: PlotSettings,
  ): Partial<Annotations>[] {
    return yRange
      .slice(0, yRange.length - 1)
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
      }));
  }

  private buildArrows(
    plot: Plot,
    plotSettings: PlotSettings,
    xValueMax: number,
    yValueMax: number,
  ): Partial<Annotations>[] {
    const arrows: Partial<Annotations>[] = [
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
        y: yValueMax,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: 0,
        ay: 20,
        arrowwidth: plotSettings.zeroLineWidth,
        arrowhead: 2,
        arrowcolor: plotSettings.zeroLineColor,
      },
    ];

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

    return arrows;
  }

  private async buildFunctionLabelImages(
    plot: Plot,
    xValuesArray: number[],
    yValuesArray: number[][],
    sizeCalc: PlotSizeCalculation,
    margin: PlotMarginMm,
  ): Promise<Partial<Plotly.Image>[]> {
    if (typeof MathJax === 'undefined') return [];

    const { mmToInches, ppiBase } = PLOT_CONSTANTS;
    const marginLPx = margin.l * mmToInches * ppiBase;
    const marginRPx = margin.r * mmToInches * ppiBase;
    const marginTPx = margin.t * mmToInches * ppiBase;
    const marginBPx = margin.b * mmToInches * ppiBase;
    const plotAreaW = sizeCalc.plotSizePx.width - marginLPx - marginRPx;
    const plotAreaH = sizeCalc.plotSizePx.height - marginTPx - marginBPx;
    const dataRangeX = sizeCalc.xValueMax - sizeCalc.xValueMin;
    const dataRangeY = sizeCalc.yValueMax - sizeCalc.yValueMin;
    const pxPerUnitX = plotAreaW / dataRangeX;
    const pxPerUnitY = plotAreaH / dataRangeY;

    const gapPx = 5;
    const gapX = gapPx / pxPerUnitX;
    const gapY = gapPx / pxPerUnitY;

    const images: Partial<Plotly.Image>[] = [];

    for (let i = 0; i < plot.fnx.length; i++) {
      const fn = plot.fnx[i];
      if (fn.legendPosition === 'none') continue;

      const fromStart = fn.legendPosition === 'start';
      const pos = this.findLabelPosition(
        xValuesArray,
        yValuesArray[i],
        sizeCalc.yValueMin,
        sizeCalc.yValueMax,
        fromStart,
      );

      if (!pos) continue;

      const rendered = await this.renderMathPng(fn.fnx, fn.color);
      if (!rendered) continue;

      const labelWidthData = rendered.widthPx / pxPerUnitX;
      const labelHeightData = rendered.heightPx / pxPerUnitY;

      // Convert data coordinates to paper coordinates (0–1 = plot area, outside = margins)
      const paperX = (pos.x - sizeCalc.xValueMin) / dataRangeX;
      const paperY = (pos.y - sizeCalc.yValueMin) / dataRangeY;
      const paperSizeX = labelWidthData / dataRangeX;
      const paperSizeY = labelHeightData / dataRangeY;
      const paperGapX = gapX / dataRangeX;
      const paperGapY = gapY / dataRangeY;

      const x = fromStart ? paperX - paperGapX : paperX + paperGapX;
      const y = paperY + paperGapY;
      const xanchor = fromStart ? 'right' : 'left';

      images.push({
        source: rendered.dataUrl,
        x,
        y,
        xref: 'paper',
        yref: 'paper',
        sizex: paperSizeX,
        sizey: paperSizeY,
        xanchor,
        yanchor: 'bottom',
        sizing: 'contain',
        layer: 'above',
      });
    }

    return images;
  }

  private findLabelPosition(
    xValues: number[],
    yValues: number[],
    yMin: number,
    yMax: number,
    fromStart: boolean,
  ): { x: number; y: number } | undefined {
    const isVisible = (i: number): boolean =>
      Number.isFinite(yValues[i]) && yValues[i] >= yMin && yValues[i] <= yMax;

    // Find the first/last visible index
    let edgeIdx = -1;
    if (fromStart) {
      for (let i = 0; i < yValues.length; i++) {
        if (isVisible(i)) {
          edgeIdx = i;
          break;
        }
      }
    } else {
      for (let i = yValues.length - 1; i >= 0; i--) {
        if (isVisible(i)) {
          edgeIdx = i;
          break;
        }
      }
    }

    if (edgeIdx === -1) return undefined;

    // Check the adjacent point just outside the visible range
    const outerIdx = fromStart ? edgeIdx - 1 : edgeIdx + 1;
    if (
      outerIdx >= 0 &&
      outerIdx < yValues.length &&
      Number.isFinite(yValues[outerIdx]) &&
      !isVisible(outerIdx)
    ) {
      // Interpolate to find the exact boundary crossing
      const yBoundary = yValues[outerIdx] > yMax ? yMax : yMin;
      const dy = yValues[outerIdx] - yValues[edgeIdx];
      if (dy !== 0) {
        const t = (yBoundary - yValues[edgeIdx]) / dy;
        const x = xValues[edgeIdx] + t * (xValues[outerIdx] - xValues[edgeIdx]);
        return { x, y: yBoundary };
      }
    }

    return { x: xValues[edgeIdx], y: yValues[edgeIdx] };
  }

  private buildPlotData(
    plot: Plot,
    plotSettings: PlotSettings,
    xValuesArray: number[],
    yValuesArray: number[][],
  ): Partial<PlotData>[] {
    const data: Partial<PlotData>[] = [];

    this.addFunctionData(data, plot, plotSettings, xValuesArray, yValuesArray);
    this.addMarkerData(data, plot);
    this.addLineData(data, plot, plotSettings);
    this.addAreaData(data, plot, plotSettings);

    return data;
  }

  private addFunctionData(
    data: Partial<PlotData>[],
    plot: Plot,
    plotSettings: PlotSettings,
    xValuesArray: number[],
    yValuesArray: number[][],
  ): void {
    if (!plot.fnx.length) return;

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

  private addMarkerData(data: Partial<PlotData>[], plot: Plot): void {
    if (!plot.markers.length) return;

    data.push({
      type: 'scatter',
      mode: 'text+markers',
      showlegend: false,
      x: plot.markers.map(marker => marker.x),
      y: plot.markers.map(marker => marker.y),
      text: plot.markers.map(marker => marker.text),
      marker: {
        symbol: 'x-thin',
        color: '#000000',
        size: 10,
        line: { width: 1.5 },
      },
      textfont: { size: 12 },
      textposition: 'bottom left',
    });
  }

  private addLineData(
    data: Partial<PlotData>[],
    plot: Plot,
    plotSettings: PlotSettings,
  ): void {
    if (!plot.lines.length) return;

    data.push(
      ...plot.lines.map<Partial<PlotData>>(line => ({
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
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

  private addAreaData(
    data: Partial<PlotData>[],
    plot: Plot,
    plotSettings: PlotSettings,
  ): void {
    if (!plot.areas.length) return;

    data.push(
      ...plot.areas.map<Partial<PlotData>>(area => ({
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
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

    this.addAreaPointMarkers(data, plot);
  }

  private addAreaPointMarkers(data: Partial<PlotData>[], plot: Plot): void {
    const areaPointMarkers: {
      x: number;
      y: number;
      text: string;
      textposition: Exclude<LabelPosition, 'auto'>;
    }[] = [];

    for (const area of plot.areas) {
      if (!area.showPoints) continue;

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

    if (!areaPointMarkers.length) return;

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
        showlegend: false,
        x: markers.map(m => m.x),
        y: markers.map(m => m.y),
        text: markers.map(m => m.text),
        marker: {
          symbol: 'x-thin',
          color: '#000000',
          size: 10,
          line: { width: 1.5 },
        },
        textfont: { size: 12 },
        textposition: position,
      });
    }
  }

  private async renderPlot(
    plot: Plot,
    plotSettings: PlotSettings,
    sizeCalc: PlotSizeCalculation,
    margin: PlotMarginMm,
    annotations: Partial<Annotations>[],
    arrows: Partial<Annotations>[],
    data: Partial<PlotData>[],
    functionLabelImages: Partial<Plotly.Image>[],
    applyScaleFactor: boolean,
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
    const { dtick, mmToInches, ppiBase } = PLOT_CONSTANTS;
    const {
      plotSizePx,
      plotSizePoints,
      xValueMin,
      xValueMax,
      yValueMin,
      yValueMax,
    } = sizeCalc;

    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;visibility:hidden';
    document.body.appendChild(tempDiv);

    try {
      await Plotly.newPlot(
        tempDiv,
        data,
        {
          autosize: false,
          showlegend: false,
          width: plotSizePx.width,
          height: plotSizePx.height,
          images: functionLabelImages.length ? functionLabelImages : undefined,
          annotations: !plot.showAxis
            ? undefined
            : plot.showAxisLabels && plot.placeAxisLabelsInside
              ? [...annotations, ...arrows]
              : arrows,
          margin: {
            t: margin.t * mmToInches * ppiBase,
            b: margin.b * mmToInches * ppiBase,
            l: margin.l * mmToInches * ppiBase,
            r: margin.r * mmToInches * ppiBase,
          },
          xaxis: {
            range: [xValueMin, xValueMax],
            autorange: false,
            showticklabels: plot.showAxisLabels && !plot.placeAxisLabelsInside,
            tickmode: 'linear',
            dtick,
            scaleanchor: 'y',
            ticklabelstep: 2,
            gridcolor: plotSettings.gridLineColor,
            gridwidth: plotSettings.gridLineWidth,
            tickfont: { size: 10 },
            zeroline: plot.showAxis,
            zerolinewidth: plotSettings.zeroLineWidth,
            zerolinecolor: plotSettings.zeroLineColor,
            linewidth: plotSettings.gridLineWidth,
            linecolor: plotSettings.gridLineColor,
            mirror: true,
          },
          yaxis: {
            range: [yValueMin, yValueMax],
            autorange: false,
            tickmode: 'linear',
            showticklabels: plot.showAxisLabels && !plot.placeAxisLabelsInside,
            dtick,
            ticklabelstep: 2,
            gridcolor: plotSettings.gridLineColor,
            gridwidth: plotSettings.gridLineWidth,
            tickfont: { size: 10 },
            zeroline: plot.showAxis,
            zerolinewidth: plotSettings.zeroLineWidth,
            zerolinecolor: plotSettings.zeroLineColor,
            linewidth: plotSettings.gridLineWidth,
            linecolor: plotSettings.gridLineColor,
            mirror: true,
          },
        },
        { staticPlot: true },
      );

      const image = await Plotly.toImage(tempDiv, {
        format: 'png',
        width: plotSizePx.width,
        height: plotSizePx.height,
        scale: applyScaleFactor ? scaleFactor : undefined,
      });

      Plotly.purge(tempDiv);
      document.body.removeChild(tempDiv);

      return {
        base64: image,
        widthInPx: plotSizePx.width,
        heightInPx: plotSizePx.height,
        widthInPoints: plotSizePoints.width,
        heightInPoints: plotSizePoints.height,
      };
    } catch {
      Plotly.purge(tempDiv);
      document.body.removeChild(tempDiv);
      return PlotGenerateErrorCode.plot;
    }
  }

  generateId(): string {
    return `${modelIdPrefix}${v7()}`;
  }

  extractRawPictureDataFromBase64Picture(base64Picture: string): string {
    return base64Picture.substring('data:image/png;base64,'.length);
  }

  calculatePlotSizeMm(plot: Plot): PlotSizeMm {
    const { dtick, mmPerTick } = PLOT_CONSTANTS;
    const margin = this.calculateEffectiveMargin(plot);
    const xRange = plot.range.x.max - plot.range.x.min;
    const yRange = plot.range.y.max - plot.range.y.min;

    const tickSquaresX = plot.squarePlots
      ? Math.max(xRange, yRange) / dtick
      : xRange / dtick;
    const tickSquaresY = plot.squarePlots
      ? Math.max(xRange, yRange) / dtick
      : yRange / dtick;

    const width = tickSquaresX * mmPerTick + margin.l + margin.r;
    const height = tickSquaresY * mmPerTick + margin.t + margin.b;

    const exceedsWidth = width > A4_USABLE_WIDTH_MM;
    const exceedsHeight = height > A4_USABLE_HEIGHT_MM;

    return {
      width,
      height,
      exceedsA4: exceedsWidth || exceedsHeight,
      exceedsWidth,
      exceedsHeight,
    };
  }

  private calculateEffectiveMargin(plot: Plot): PlotMarginMm {
    const base = PLOT_CONSTANTS.mmMargin;
    let extraLeft = 0;
    let extraRight = 0;

    const pxPerChar = 6;
    const xshiftPx = 5;
    const pxToMm = 25.4 / PLOT_CONSTANTS.ppiBase;

    for (const fn of plot.fnx) {
      if (fn.legendPosition === 'none') continue;

      const textWidthMm = (fn.fnx.length * pxPerChar + xshiftPx) * pxToMm;
      const extraNeeded = Math.max(0, textWidthMm - base.l);

      if (fn.legendPosition === 'start') {
        extraLeft = Math.max(extraLeft, extraNeeded);
      } else {
        extraRight = Math.max(extraRight, extraNeeded);
      }
    }

    return {
      t: base.t,
      b: base.b,
      l: base.l + extraLeft,
      r: base.r + extraRight,
    };
  }

  private async renderMathPng(
    expression: string,
    color: string,
  ): Promise<
    { dataUrl: string; widthPx: number; heightPx: number } | undefined
  > {
    try {
      const node = mathjs.parse(expression);
      if (node.type === 'ConstantNode') return undefined;
      const tex = node.toTex({ parenthesis: 'keep' });

      const container = MathJax.tex2svg(tex) as Element;
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText =
        'position:absolute;visibility:hidden;font-size:10px';
      tempDiv.appendChild(container);
      document.body.appendChild(tempDiv);

      const svg = tempDiv.querySelector('svg');
      if (!svg) {
        document.body.removeChild(tempDiv);
        return undefined;
      }

      const rect = svg.getBoundingClientRect();
      const widthPx = rect.width;
      const heightPx = rect.height;

      if (widthPx === 0 || heightPx === 0) {
        document.body.removeChild(tempDiv);
        return undefined;
      }

      // Serialize SVG (self-contained thanks to fontCache: 'none' in MathJax config)
      const svgClone = svg.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', `${widthPx}`);
      svgClone.setAttribute('height', `${heightPx}`);

      let svgString = new XMLSerializer().serializeToString(svgClone);
      svgString = svgString.replace(/currentColor/g, color);

      document.body.removeChild(tempDiv);

      // Convert SVG to PNG via canvas
      const renderScale = 4;
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      try {
        const img = await this.loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(widthPx * renderScale);
        canvas.height = Math.ceil(heightPx * renderScale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return {
          dataUrl: canvas.toDataURL('image/png'),
          widthPx,
          heightPx,
        };
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      return undefined;
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = (): void => {
        resolve(img);
      };
      img.onerror = (): void => {
        reject(new Error('Failed to load image'));
      };
      img.src = src;
    });
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
