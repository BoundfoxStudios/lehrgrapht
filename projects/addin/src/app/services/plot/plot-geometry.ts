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
