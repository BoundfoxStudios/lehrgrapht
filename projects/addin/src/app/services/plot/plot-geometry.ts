import type { Plot, UnitsPerSquare } from '../../models/plot';
import { isFiniteNumber, PLOT_CONSTANTS } from './plot.types';

export interface SquareCounts {
  x: number;
  y: number;
}

export interface RenderScale {
  x: number;
  y: number;
}

// Plots saved by a dev build carry version 0.0.0 and skip every migration, so the field can be missing
export const effectiveUnitsPerSquare = (
  unitsPerSquare: Partial<UnitsPerSquare> | undefined,
): UnitsPerSquare => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;
  const usableOrDefault = (units: number | undefined): number =>
    isFiniteNumber(units) && units > 0 ? units : renderUnitsPerSquare;

  return {
    x: usableOrDefault(unitsPerSquare?.x),
    y: usableOrDefault(unitsPerSquare?.y),
  };
};

export const snapToSquare = (value: number, unitsPerSquare: number): number => {
  const squareIndex = Math.round(value / unitsPerSquare);

  // 3 * 0.2 is 0.6000000000000001, and such a value breaks the exact collinearity test of dedupePolygonPoints
  return Number((squareIndex * unitsPerSquare).toPrecision(12));
};

export const squareCounts = (
  xRange: number,
  yRange: number,
  unitsPerSquare: UnitsPerSquare,
  squarePlots: boolean,
): SquareCounts => {
  const scale = effectiveUnitsPerSquare(unitsPerSquare);
  const xCount = xRange / scale.x;
  const yCount = yRange / scale.y;
  const largerCount = Math.max(xCount, yCount);

  return {
    x: squarePlots ? largerCount : xCount,
    y: squarePlots ? largerCount : yCount,
  };
};

export const renderScale = (plot: Plot): RenderScale => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;
  const scale = effectiveUnitsPerSquare(plot.unitsPerSquare);

  return {
    x: renderUnitsPerSquare / scale.x,
    y: renderUnitsPerSquare / scale.y,
  };
};

export const gridMultipliers = (
  min: number,
  max: number,
  step: number,
): number[] => {
  if (!isFiniteNumber(step) || step <= 0) {
    return [];
  }

  const epsilon = (max - min) * 1e-9;
  const firstMultiplier = Math.ceil((min - epsilon) / step);
  const lastMultiplier = Math.floor((max + epsilon) / step);
  const multipliers: number[] = [];

  // Math.ceil returns -0 for a range starting just below zero, and Plotly drops the grid line only on exactly 0
  for (
    let multiplier = firstMultiplier === 0 ? 0 : firstMultiplier;
    multiplier <= lastMultiplier;
    multiplier++
  ) {
    multipliers.push(multiplier);
  }

  return multipliers;
};

// Plotly writes negative tick labels with U+2212, but skips its own number formatting for tickmode 'array'
export const formatAxisValue = (value: number): string => {
  const text = `${Number(value.toPrecision(12))}`;

  return text.startsWith('-') ? `−${text.slice(1)}` : text;
};

export interface AxisTicks {
  tickvals: number[];
  ticktext: string[];
}

export const buildAxisTicks = (
  dataMin: number,
  dataMax: number,
  dataStep: number,
  factor: number,
): AxisTicks => {
  if (!isFiniteNumber(dataStep) || dataStep <= 0) {
    return { tickvals: [], ticktext: [] };
  }

  if (dataMin === dataMax) {
    return {
      tickvals: [dataMin * factor],
      ticktext: [formatAxisValue(dataMin)],
    };
  }

  const multipliers = gridMultipliers(dataMin, dataMax, dataStep);

  return {
    tickvals: multipliers.map(multiplier => multiplier * dataStep * factor),
    ticktext: multipliers.map(multiplier =>
      multiplier % 2 === 0 ? formatAxisValue(multiplier * dataStep) : '',
    ),
  };
};
