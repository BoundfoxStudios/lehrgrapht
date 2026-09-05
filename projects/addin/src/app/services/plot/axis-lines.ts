import type { Shape } from 'plotly.js-dist-min';
import { PlotSettings } from '../../models/plot';
import type { AxisOrigin, RenderScale } from './plot-geometry';

export const buildAxisLines = (
  origin: AxisOrigin,
  scale: RenderScale,
  plotSettings: PlotSettings,
): Partial<Shape>[] => {
  const line = {
    color: plotSettings.zeroLineColor,
    width: plotSettings.zeroLineWidth,
  };
  const shapes: Partial<Shape>[] = [];

  if (origin.x !== 0) {
    shapes.push({
      type: 'line',
      // A paper-referenced end forces the shape into the lower layer on any setting but 'above', where the grid and the plot frame would draw over the axis
      layer: 'above',
      xref: 'x',
      x0: origin.x * scale.x,
      x1: origin.x * scale.x,
      yref: 'paper',
      y0: 0,
      y1: 1,
      line,
    });
  }

  if (origin.y !== 0) {
    shapes.push({
      type: 'line',
      layer: 'above',
      xref: 'paper',
      x0: 0,
      x1: 1,
      yref: 'y',
      y0: origin.y * scale.y,
      y1: origin.y * scale.y,
      line,
    });
  }

  return shapes;
};
