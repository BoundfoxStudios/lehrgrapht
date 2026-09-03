import { Injectable } from '@angular/core';
import {
  isFiniteNumber,
  PLOT_CONSTANTS,
  PlotMarginMm,
  PlotSizeCalculation,
} from './plot.types';

export interface LabelImageCoordinates {
  x: number;
  y: number;
  sizex: number;
  sizey: number;
  xanchor: 'left' | 'right';
}

@Injectable({ providedIn: 'root' })
export class PlotLabelsService {
  findLabelPosition(
    xValues: number[],
    yValues: (number | null)[],
    yMin: number,
    yMax: number,
    fromStart: boolean,
  ): { x: number; y: number } | undefined {
    const isVisible = (index: number): boolean => {
      const value = yValues[index];
      return isFiniteNumber(value) && value >= yMin && value <= yMax;
    };

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

    const edge = yValues[edgeIdx];
    if (!isFiniteNumber(edge)) {
      return undefined;
    }

    const outerIdx = fromStart ? edgeIdx - 1 : edgeIdx + 1;
    const outer = yValues[outerIdx];
    if (isFiniteNumber(outer) && !isVisible(outerIdx)) {
      const yBoundary = outer > yMax ? yMax : yMin;
      const dy = outer - edge;
      if (dy !== 0) {
        const t = (yBoundary - edge) / dy;
        const x = xValues[edgeIdx] + t * (xValues[outerIdx] - xValues[edgeIdx]);
        return { x, y: yBoundary };
      }
    }

    return { x: xValues[edgeIdx], y: edge };
  }

  calculateLabelImageCoordinates(
    pos: { x: number; y: number },
    widthPx: number,
    heightPx: number,
    sizeCalc: PlotSizeCalculation,
    margin: PlotMarginMm,
    fromStart: boolean,
  ): LabelImageCoordinates {
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

    const labelWidthData = widthPx / pxPerUnitX;
    const labelHeightData = heightPx / pxPerUnitY;

    const paperX = (pos.x - sizeCalc.xValueMin) / dataRangeX;
    const paperY = (pos.y - sizeCalc.yValueMin) / dataRangeY;
    const paperSizeX = labelWidthData / dataRangeX;
    const paperSizeY = labelHeightData / dataRangeY;
    const paperGapX = gapX / dataRangeX;
    const paperGapY = gapY / dataRangeY;

    const x = fromStart ? paperX - paperGapX : paperX + paperGapX;
    const y = paperY + paperGapY;
    const xanchor = fromStart ? 'right' : 'left';

    return { x, y, sizex: paperSizeX, sizey: paperSizeY, xanchor };
  }
}
