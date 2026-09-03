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

export const squareCounts = (
  xRange: number,
  yRange: number,
  squarePlots: boolean,
): SquareCounts => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;
  const largerRange = Math.max(xRange, yRange);

  return {
    x: (squarePlots ? largerRange : xRange) / renderUnitsPerSquare,
    y: (squarePlots ? largerRange : yRange) / renderUnitsPerSquare,
  };
};

export const renderScale = (plot: Plot): RenderScale => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;

  // Plots saved by a dev build carry version 0.0.0 and skip every migration, so the field can be missing
  const stored = plot.unitsPerSquare as Partial<UnitsPerSquare> | undefined;

  const clamp = (units: number | undefined): number =>
    isFiniteNumber(units) && units > 0 ? units : renderUnitsPerSquare;

  return {
    x: renderUnitsPerSquare / clamp(stored?.x),
    y: renderUnitsPerSquare / clamp(stored?.y),
  };
};
