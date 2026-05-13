import { Injectable } from '@angular/core';
import { Dash, PlotData } from 'plotly.js-dist-min';
import {
  LabelPosition,
  Plot,
  PlotSettings,
  PolygonPoint,
} from '../../models/plot';
import {
  computeAxisLineEndpoints,
  reflectPoint,
  reflectPolygonPoints,
} from './reflection';
import { hexToRgba, PLOT_CONSTANTS } from './plot.types';

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
    xValuesArray: number[],
    yValuesArray: number[][],
    options: PolygonRenderOptions = {},
  ): Partial<PlotData>[] {
    return [
      ...this.buildFunctionTraces(
        plot,
        plotSettings,
        xValuesArray,
        yValuesArray,
      ),
      ...this.buildMarkerTraces(plot, { showSolution: options.showSolution }),
      ...this.buildPolygonTraces(plot, plotSettings, options),
      ...this.buildReflectionTraces(plot),
    ];
  }

  buildFunctionTraces(
    plot: Plot,
    plotSettings: PlotSettings,
    xValuesArray: number[],
    yValuesArray: number[][],
  ): Partial<PlotData>[] {
    if (!plot.fnx.length) return [];

    return yValuesArray.map((y, i) => ({
      type: 'scatter',
      x: xValuesArray,
      y,
      line: {
        color: plot.fnx[i].color,
        width: plotSettings.plotLineWidth,
        dash: plot.fnx[i].lineStyle === 'dashed' ? 'dash' : 'solid',
      },
    }));
  }

  buildMarkerTraces(
    plot: Plot,
    options: { showSolution?: boolean } = {},
  ): Partial<PlotData>[] {
    const traces: Partial<PlotData>[] = [];

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
      options.showSolution &&
      plot.reflection.kind !== 'none' &&
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
  ): Partial<PlotData>[] {
    if (!plot.polygons.length) return [];

    const highlightedIndex = options.highlightedPolygonIndex ?? null;

    const haloTraces: Partial<PlotData>[] = [];
    const polygonTraces = plot.polygons.map<Partial<PlotData>>((polygon, i) => {
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

      return {
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
              ? this.calculatePolygonDashPattern(polygon.points, closed)
              : 'solid',
        },
      };
    });

    const mirroredTraces: Partial<PlotData>[] = [];
    if (options.showSolution && plot.reflection.kind !== 'none') {
      for (const polygon of plot.polygons) {
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
                ? this.calculatePolygonDashPattern(mirroredPoints, closed)
                : 'solid',
          },
        });
      }
    }

    return [
      ...haloTraces,
      ...polygonTraces,
      ...mirroredTraces,
      ...this.buildPolygonPointMarkerTraces(plot),
    ];
  }

  buildReflectionTraces(plot: Plot): Partial<PlotData>[] {
    if (plot.reflection.kind === 'none') return [];

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

    const endpoints = computeAxisLineEndpoints(
      plot.reflection.axis,
      plot.range,
    );
    if (!endpoints) return [];

    return [
      {
        type: 'scatter',
        mode: 'lines',
        showlegend: false,
        x: [endpoints[0].x, endpoints[1].x],
        y: [endpoints[0].y, endpoints[1].y],
        line: {
          color: '#888888',
          width: 1,
          dash: 'dash',
        },
        hoverinfo: 'skip',
      },
    ];
  }

  private calculatePolygonDashPattern(
    points: readonly PolygonPoint[],
    closed: boolean,
  ): Dash {
    let perimeter = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    if (closed && points.length > 0) {
      const dx = points[0].x - points[points.length - 1].x;
      const dy = points[0].y - points[points.length - 1].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    if (perimeter === 0) return 'dash';

    const numPeriods = Math.max(
      1,
      Math.round(perimeter / DASH_TARGET_PERIOD_UNITS),
    );
    const periodUnits = perimeter / numPeriods;

    const { dtick, mmPerTick, mmToInches, ppiBase } = PLOT_CONSTANTS;
    const pxPerUnit = (mmPerTick / dtick) * mmToInches * ppiBase;
    const dashPx = periodUnits * DASH_RATIO * pxPerUnit;
    const gapPx = periodUnits * (1 - DASH_RATIO) * pxPerUnit;

    return `${dashPx}px,${gapPx}px` as Dash;
  }

  private buildPolygonPointMarkerTraces(plot: Plot): Partial<PlotData>[] {
    const polygonPointMarkers: {
      x: number;
      y: number;
      text: string;
      textposition: Exclude<LabelPosition, 'auto'>;
    }[] = [];

    for (const polygon of plot.polygons) {
      if (!polygon.showPoints) continue;

      for (const point of polygon.points) {
        const position =
          point.labelPosition !== 'auto'
            ? point.labelPosition
            : this.calculateLabelPosition(point, polygon.points);
        polygonPointMarkers.push({
          x: point.x,
          y: point.y,
          text: point.labelText,
          textposition: position,
        });
      }
    }

    if (!polygonPointMarkers.length) return [];

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

    const traces: Partial<PlotData>[] = [];

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
