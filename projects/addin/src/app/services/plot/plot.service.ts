import * as mathjs from 'mathjs';
import { inject, Injectable } from '@angular/core';
import Plotly, { Annotations, PlotData } from 'plotly.js-dist-min';
import { Plot, PlotSettings } from '../../models/plot';
import { modelIdPrefix } from '../word/word.service';
import { v7 } from 'uuid';
import {
  PLOT_CONSTANTS,
  PlotGenerateErrorCode,
  PlotMarginMm,
  PlotSizeCalculation,
  PlotSizeMm,
} from './plot.types';
import { PlotMathService } from './plot-math.service';
import { PlotSizeService } from './plot-size.service';
import { PlotAnnotationsService } from './plot-annotations.service';
import { PlotDataService } from './plot-data.service';
import { PlotLabelsService } from './plot-labels.service';

const devicePixelRatio = window.devicePixelRatio || 1;
const effectiveDpi = 254 * devicePixelRatio;
const scaleFactor = effectiveDpi / PLOT_CONSTANTS.ppiBase;

@Injectable({ providedIn: 'root' })
export class PlotService {
  private readonly plotMathService = inject(PlotMathService);
  private readonly plotSizeService = inject(PlotSizeService);
  private readonly plotAnnotationsService = inject(PlotAnnotationsService);
  private readonly plotDataService = inject(PlotDataService);
  private readonly plotLabelsService = inject(PlotLabelsService);

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
    const expressions = this.plotMathService.compileExpressions(plot.fnx);
    if (expressions === PlotGenerateErrorCode.compile) {
      return PlotGenerateErrorCode.compile;
    }

    const valueRanges = this.plotMathService.createRanges(plot);
    const yValues = this.plotMathService.evaluateExpressions(
      expressions,
      valueRanges,
    );
    if (yValues === PlotGenerateErrorCode.evaluate) {
      return PlotGenerateErrorCode.evaluate;
    }

    const cleanedValues = this.plotMathService.cleanUpValues(
      yValues,
      valueRanges,
      plot,
    );
    const margin = this.plotSizeService.calculateEffectiveMargin(plot);
    const sizeCalc = this.plotSizeService.calculatePlotSize(
      plot,
      cleanedValues,
      valueRanges,
      margin,
    );
    const annotations = this.plotAnnotationsService.buildAnnotations(
      plot,
      plotSettings,
    );
    const functionLabelImages = await this.buildFunctionLabelImages(
      plot,
      cleanedValues.xValuesArray,
      cleanedValues.yValuesArray,
      sizeCalc,
      margin,
    );
    const arrows = this.plotAnnotationsService.buildArrows(
      plot,
      plotSettings,
      sizeCalc.xValueMax,
      sizeCalc.yValueMax,
    );
    const data = this.plotDataService.buildPlotData(
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

  generateId(): string {
    return `${modelIdPrefix}${v7()}`;
  }

  extractRawPictureDataFromBase64Picture(base64Picture: string): string {
    return base64Picture.substring('data:image/png;base64,'.length);
  }

  calculatePlotSizeMm(plot: Plot): PlotSizeMm {
    return this.plotSizeService.calculatePlotSizeMm(plot);
  }

  private async buildFunctionLabelImages(
    plot: Plot,
    xValuesArray: number[],
    yValuesArray: number[][],
    sizeCalc: PlotSizeCalculation,
    margin: PlotMarginMm,
  ): Promise<Partial<Plotly.Image>[]> {
    if (typeof MathJax === 'undefined') return [];

    const images: Partial<Plotly.Image>[] = [];

    for (let i = 0; i < plot.fnx.length; i++) {
      const fn = plot.fnx[i];
      if (fn.legendPosition === 'none') continue;

      const fromStart = fn.legendPosition === 'start';
      const pos = this.plotLabelsService.findLabelPosition(
        xValuesArray,
        yValuesArray[i],
        sizeCalc.yValueMin,
        sizeCalc.yValueMax,
        fromStart,
      );

      if (!pos) continue;

      const rendered = await this.renderMathPng(fn.fnx, fn.color);
      if (!rendered) continue;

      const coords = this.plotLabelsService.calculateLabelImageCoordinates(
        pos,
        rendered.widthPx,
        rendered.heightPx,
        sizeCalc,
        margin,
        fromStart,
      );

      images.push({
        source: rendered.dataUrl,
        x: coords.x,
        y: coords.y,
        xref: 'paper',
        yref: 'paper',
        sizex: coords.sizex,
        sizey: coords.sizey,
        xanchor: coords.xanchor,
        yanchor: 'bottom',
        sizing: 'contain',
        layer: 'above',
      });
    }

    return images;
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

      const svgClone = svg.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', `${widthPx}`);
      svgClone.setAttribute('height', `${heightPx}`);

      let svgString = new XMLSerializer().serializeToString(svgClone);
      svgString = svgString.replace(/currentColor/g, color);

      document.body.removeChild(tempDiv);

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
}
