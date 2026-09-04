import type {
  Plot,
  SquareRounding,
  SquareRoundingPerAxis,
  UnitsPerSquare,
} from '../../models/plot';
import { isFiniteNumber, PLOT_CONSTANTS } from './plot.types';

export interface SquareCounts {
  x: number;
  y: number;
}

export interface RenderScale {
  x: number;
  y: number;
}

export interface AxisRange {
  min: number;
  max: number;
}

export interface SquareCountsInput {
  xRange: number;
  yRange: number;
  unitsPerSquare: UnitsPerSquare;
  squareRounding: SquareRoundingPerAxis;
  squarePlots: boolean;
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

const effectiveSquareRounding = (
  squareRounding: Partial<SquareRoundingPerAxis> | undefined,
): SquareRoundingPerAxis => ({
  x: squareRounding?.x === 'down' ? 'down' : 'up',
  y: squareRounding?.y === 'down' ? 'down' : 'up',
});

const wholeSquares = (count: number, rounding: SquareRounding): number => {
  // 6 / 0.4 is 14.999999999999998, and rounding that up would add a square the range does not need
  const withoutFloatingPointNoise = Number(count.toPrecision(12));

  return Math.max(
    1,
    rounding === 'down'
      ? Math.floor(withoutFloatingPointNoise)
      : Math.ceil(withoutFloatingPointNoise),
  );
};

export const squareCounts = ({
  xRange,
  yRange,
  unitsPerSquare,
  squareRounding,
  squarePlots,
}: SquareCountsInput): SquareCounts => {
  const scale = effectiveUnitsPerSquare(unitsPerSquare);
  const rounding = effectiveSquareRounding(squareRounding);
  const xCount = wholeSquares(xRange / scale.x, rounding.x);
  const yCount = wholeSquares(yRange / scale.y, rounding.y);
  const largerCount = Math.max(xCount, yCount);

  return {
    x: squarePlots ? largerCount : xCount,
    y: squarePlots ? largerCount : yCount,
  };
};

// The whole square count moves the maximum, so the entered minimum always stays where the user put it
export const drawnAxisRange = (
  min: number,
  squares: number,
  unitsPerSquare: number,
): AxisRange => ({
  min,
  max: Number((min + squares * unitsPerSquare).toPrecision(12)),
});

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
