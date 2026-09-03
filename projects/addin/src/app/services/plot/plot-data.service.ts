import { Injectable } from '@angular/core';
import { Dash } from 'plotly.js-dist-min';
import {
  LabelPosition,
  Plot,
  PlotSettings,
  Polygon,
  PolygonPoint,
} from '../../models/plot';
import {
  computeAxisLineEndpoints,
  reflectPoint,
  reflectPolygonPoints,
} from './reflection';
import { FunctionSeries, hexToRgba, PLOT_CONSTANTS } from './plot.types';
import { RenderScale, renderScale } from './plot-geometry';
import { PlotTrace } from './render-space';

const DASH_TARGET_PERIOD_UNITS = 0.5;
const DASH_RATIO = 0.6;
const HIGHLIGHT_LINE_WIDTH_MULTIPLIER = 1;
const HIGHLIGHT_HALO_WIDTH_MULTIPLIER = 3;
const HIGHLIGHT_HALO_ALPHA = 0.3;

export interface PolygonRenderOptions {
  highlightedPolygonIndex?: number | null;
  showSolution?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlotDataService {
  buildPlotData(
    plot: Plot,
    plotSettings: PlotSettings,
    series: FunctionSeries[],
    options: PolygonRenderOptions = {},
  ): PlotTrace[] {
    return [
      ...this.buildFunctionTraces(plot, plotSettings, series),
      ...this.buildMarkerTraces(plot, { showSolution: options.showSolution }),
      ...this.buildPolygonTraces(plot, plotSettings, options),
      ...this.buildReflectionTraces(plot, plotSettings),
    ];
  }

  buildFunctionTraces(
    plot: Plot,
    plotSettings: PlotSettings,
    series: FunctionSeries[],
  ): PlotTrace[] {
    return series.map((functionSeries, index) => ({
      type: 'scatter',
      x: functionSeries.x,
      y: functionSeries.y,
      connectgaps: false,
      line: {
        color: plot.fnx[index].color,
        width: plotSettings.plotLineWidth,
        dash: plot.fnx[index].lineStyle === 'dashed' ? 'dash' : 'solid',
      },
    }));
  }

  buildMarkerTraces(
    plot: Plot,
    options: { showSolution?: boolean } = {},
  ): PlotTrace[] {
    const traces: PlotTrace[] = [];

    if (plot.markers.length) {
      traces.push({
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

    if (
      plot.reflection.kind !== 'none' &&
      (!plot.reflection.isSolution || options.showSolution === true) &&
      plot.markers.length
    ) {
      const mirrored = plot.markers.map(m => {
        const reflected = reflectPoint({ x: m.x, y: m.y }, plot.reflection);
        return { ...reflected, text: m.text ? `${m.text}'` : '' };
      });
      traces.push({
        type: 'scatter',
        mode: 'text+markers',
        showlegend: false,
        x: mirrored.map(m => m.x),
        y: mirrored.map(m => m.y),
        text: mirrored.map(m => m.text),
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

    return traces;
  }

  buildPolygonTraces(
    plot: Plot,
    plotSettings: PlotSettings,
    options: PolygonRenderOptions = {},
  ): PlotTrace[] {
    if (!plot.polygons.length) {
      return [];
    }

    const highlightedIndex = options.highlightedPolygonIndex ?? null;
    const scale = renderScale(plot);

    const isVisible = (polygon: Polygon): boolean =>
      !polygon.isSolution || options.showSolution === true;

    const haloTraces: PlotTrace[] = [];
    const polygonTraces: PlotTrace[] = [];
    plot.polygons.forEach((polygon, i) => {
      if (!isVisible(polygon)) {
        return;
      }

      const closed = polygon.connect;
      const orderedPoints =
        closed && polygon.points.length > 0
          ? [...polygon.points, polygon.points[0]]
          : polygon.points;

      const fillStyle = polygon.fillStyle;
      const hasFill =
        closed && polygon.points.length >= 3 && fillStyle !== 'outline';
      const fillColor = hasFill
        ? (polygon.fillColor ?? polygon.lineColor)
        : null;
      const isHighlighted = i === highlightedIndex;
      const lineWidth = isHighlighted
        ? plotSettings.plotLineWidth * HIGHLIGHT_LINE_WIDTH_MULTIPLIER
        : plotSettings.plotLineWidth;

      if (isHighlighted) {
        haloTraces.push({
          type: 'scatter',
          mode: 'lines',
          showlegend: false,
          fill: 'none',
          x: orderedPoints.map(p => p.x),
          y: orderedPoints.map(p => p.y),
          line: {
            color: hexToRgba(polygon.lineColor, HIGHLIGHT_HALO_ALPHA),
            width: plotSettings.plotLineWidth * HIGHLIGHT_HALO_WIDTH_MULTIPLIER,
            dash: 'solid',
          },
          hoverinfo: 'skip',
        });
      }

      polygonTraces.push({
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
        fill: fillColor !== null ? 'toself' : 'none',
        fillcolor:
          fillColor !== null
            ? fillStyle === 'hatched'
              ? hexToRgba(fillColor, 0.35)
              : hexToRgba(fillColor, 0.7)
            : undefined,
        fillpattern:
          fillStyle === 'hatched' && fillColor !== null
            ? { shape: '/', size: 8, fgcolor: fillColor }
            : undefined,
        x: orderedPoints.map(p => p.x),
        y: orderedPoints.map(p => p.y),
        line: {
          color: polygon.lineColor,
          width: lineWidth,
          dash:
            polygon.lineStyle === 'dashed'
              ? this.calculatePolygonDashPattern(polygon.points, closed, scale)
              : 'solid',
        },
      });
    });

    const mirroredTraces: PlotTrace[] = [];
    if (
      plot.reflection.kind !== 'none' &&
      (!plot.reflection.isSolution || options.showSolution === true)
    ) {
      for (const polygon of plot.polygons) {
        if (!isVisible(polygon)) {
          continue;
        }
        const mirroredPoints = reflectPolygonPoints(
          polygon.points,
          plot.reflection,
        );
        const closed = polygon.connect;
        const orderedPoints =
          closed && mirroredPoints.length > 0
            ? [...mirroredPoints, mirroredPoints[0]]
            : mirroredPoints;
        const hasFill =
          closed &&
          mirroredPoints.length >= 3 &&
          polygon.fillStyle !== 'outline';
        const fillColor = hasFill
          ? (polygon.fillColor ?? polygon.lineColor)
          : null;

        mirroredTraces.push({
          type: 'scatter',
          mode: 'lines',
          showlegend: false,
          fill: fillColor !== null ? 'toself' : 'none',
          fillcolor:
            fillColor !== null
              ? polygon.fillStyle === 'hatched'
                ? hexToRgba(fillColor, 0.35)
                : hexToRgba(fillColor, 0.7)
              : undefined,
          fillpattern:
            polygon.fillStyle === 'hatched' && fillColor !== null
              ? { shape: '/', size: 8, fgcolor: fillColor }
              : undefined,
          x: orderedPoints.map(p => p.x),
          y: orderedPoints.map(p => p.y),
          line: {
            color: polygon.lineColor,
            width: plotSettings.plotLineWidth,
            dash:
              polygon.lineStyle === 'dashed'
                ? this.calculatePolygonDashPattern(
                    mirroredPoints,
                    closed,
                    scale,
                  )
                : 'solid',
          },
        });
      }
    }

    return [
      ...haloTraces,
      ...polygonTraces,
      ...mirroredTraces,
      ...this.buildPolygonPointMarkerTraces(plot, scale, options),
    ];
  }

  buildReflectionTraces(plot: Plot, plotSettings: PlotSettings): PlotTrace[] {
    if (plot.reflection.kind === 'none') {
      return [];
    }

    if (plot.reflection.kind === 'point') {
      const { x, y } = plot.reflection.point;
      return [
        {
          type: 'scatter',
          mode: 'text+markers',
          showlegend: false,
          x: [x],
          y: [y],
          text: ['S'],
          marker: {
            symbol: 'cross-thin',
            color: '#666666',
            size: 12,
            line: { width: 2 },
          },
          textfont: { size: 12, color: '#666666' },
          textposition: 'top right',
          hoverinfo: 'skip',
        },
      ];
    }

    const axis = plot.reflection.axis;
    let from: { x: number; y: number };
    let to: { x: number; y: number };
    if (plot.reflection.extendBeyondPoints) {
      const endpoints = computeAxisLineEndpoints(axis, plot.range);
      if (!endpoints) {
        return [];
      }
      [from, to] = endpoints;
    } else {
      if (axis.p1.x === axis.p2.x && axis.p1.y === axis.p2.y) {
        return [];
      }
      from = axis.p1;
      to = axis.p2;
    }

    return [
      {
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
        x: [from.x, to.x],
        y: [from.y, to.y],
        line: {
          color: plot.reflection.color,
          width: plotSettings.plotLineWidth,
          dash: plot.reflection.lineStyle === 'dashed' ? 'dash' : 'solid',
        },
        hoverinfo: 'skip',
      },
    ];
  }

  private calculatePolygonDashPattern(
    points: readonly PolygonPoint[],
    closed: boolean,
    scale: RenderScale,
  ): Dash {
    const edgeLength = (from: PolygonPoint, to: PolygonPoint): number => {
      const dx = (to.x - from.x) * scale.x;
      const dy = (to.y - from.y) * scale.y;

      return Math.sqrt(dx * dx + dy * dy);
    };

    let perimeter = 0;
    for (let index = 0; index < points.length - 1; index++) {
      perimeter += edgeLength(points[index], points[index + 1]);
    }
    if (closed && points.length > 0) {
      perimeter += edgeLength(points[points.length - 1], points[0]);
    }

    if (perimeter === 0) {
      return 'dash';
    }

    const numPeriods = Math.max(
      1,
      Math.round(perimeter / DASH_TARGET_PERIOD_UNITS),
    );
    const periodUnits = perimeter / numPeriods;

    const { renderUnitsPerSquare, mmPerSquare, mmToInches, ppiBase } =
      PLOT_CONSTANTS;
    const pxPerRenderUnit =
      (mmPerSquare / renderUnitsPerSquare) * mmToInches * ppiBase;
    const dashPx = periodUnits * DASH_RATIO * pxPerRenderUnit;
    const gapPx = periodUnits * (1 - DASH_RATIO) * pxPerRenderUnit;

    return `${dashPx}px,${gapPx}px` as Dash;
  }

  private buildPolygonPointMarkerTraces(
    plot: Plot,
    scale: RenderScale,
    options: PolygonRenderOptions = {},
  ): PlotTrace[] {
    const polygonPointMarkers: {
      x: number;
      y: number;
      text: string;
      textposition: Exclude<LabelPosition, 'auto'>;
    }[] = [];

    for (const polygon of plot.polygons) {
      if (!polygon.showPoints) {
        continue;
      }
      if (polygon.isSolution && !options.showSolution) {
        continue;
      }

      for (const point of polygon.points) {
        const position =
          point.labelPosition !== 'auto'
            ? point.labelPosition
            : this.calculateLabelPosition(point, polygon.points, scale);
        polygonPointMarkers.push({
          x: point.x,
          y: point.y,
          text: point.labelText,
          textposition: position,
        });
      }
    }

    if (!polygonPointMarkers.length) {
      return [];
    }

    const groupedByPosition = new Map<
      Exclude<LabelPosition, 'auto'>,
      typeof polygonPointMarkers
    >();

    for (const marker of polygonPointMarkers) {
      const existing = groupedByPosition.get(marker.textposition);
      if (existing) {
        existing.push(marker);
      } else {
        groupedByPosition.set(marker.textposition, [marker]);
      }
    }

    const traces: PlotTrace[] = [];

    for (const [position, markers] of groupedByPosition) {
      traces.push({
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

    return traces;
  }

  calculateLabelPosition(
    point: PolygonPoint,
    polygonPoints: PolygonPoint[],
    scale: RenderScale,
  ): Exclude<LabelPosition, 'auto'> {
    const centroid = {
      x: polygonPoints.reduce((sum, p) => sum + p.x, 0) / polygonPoints.length,
      y: polygonPoints.reduce((sum, p) => sum + p.y, 0) / polygonPoints.length,
    };

    const dx = (point.x - centroid.x) * scale.x;
    const dy = (point.y - centroid.y) * scale.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle >= -22.5 && angle < 22.5) {
      return 'middle right';
    }
    if (angle >= 22.5 && angle < 67.5) {
      return 'top right';
    }
    if (angle >= 67.5 && angle < 112.5) {
      return 'top center';
    }
    if (angle >= 112.5 && angle < 157.5) {
      return 'top left';
    }
    if (angle >= 157.5 || angle < -157.5) {
      return 'middle left';
    }
    if (angle >= -157.5 && angle < -112.5) {
      return 'bottom left';
    }
    if (angle >= -112.5 && angle < -67.5) {
      return 'bottom center';
    }
    return 'bottom right';
  }
}
