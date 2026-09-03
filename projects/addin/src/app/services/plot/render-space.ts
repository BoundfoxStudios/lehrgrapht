import type { Annotations, PlotData } from 'plotly.js-dist-min';
import type { RenderScale } from './plot-geometry';

export interface PlotTrace extends Partial<PlotData> {
  x: number[];
  y: (number | null)[];
}

export const toRenderTraces = (
  traces: PlotTrace[],
  scale: RenderScale,
): PlotTrace[] =>
  traces.map(trace => ({
    ...trace,
    x: trace.x.map(value => value * scale.x),
    y: trace.y.map(value => (value === null ? null : value * scale.y)),
  }));

export const toRenderAnnotations = (
  annotations: Partial<Annotations>[],
  scale: RenderScale,
): Partial<Annotations>[] =>
  annotations.map(annotation => ({
    ...annotation,
    x:
      annotation.xref === 'x' && typeof annotation.x === 'number'
        ? annotation.x * scale.x
        : annotation.x,
    y:
      annotation.yref === 'y' && typeof annotation.y === 'number'
        ? annotation.y * scale.y
        : annotation.y,
  }));
