import { Injectable } from '@angular/core';
import { PlotData } from 'plotly.js-dist-min';
import {
  AreaPoint,
  LabelPosition,
  Plot,
  PlotSettings,
} from '../../models/plot';
import { hexToRgba } from './plot.types';

@Injectable({ providedIn: 'root' })
export class PlotDataService {
  buildPlotData(
    plot: Plot,
    plotSettings: PlotSettings,
    xValuesArray: number[],
    yValuesArray: number[][],
  ): Partial<PlotData>[] {
    return [
      ...this.buildFunctionTraces(
        plot,
        plotSettings,
        xValuesArray,
        yValuesArray,
      ),
      ...this.buildMarkerTraces(plot),
      ...this.buildLineTraces(plot, plotSettings),
      ...this.buildAreaTraces(plot, plotSettings),
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
      },
    })) as Partial<PlotData>[];
  }

  buildMarkerTraces(plot: Plot): Partial<PlotData>[] {
    if (!plot.markers.length) return [];

    return [
      {
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
      },
    ];
  }

  buildLineTraces(plot: Plot, plotSettings: PlotSettings): Partial<PlotData>[] {
    if (!plot.lines.length) return [];

    return plot.lines.map<Partial<PlotData>>(line => ({
      type: 'scatter',
      mode: 'lines',
      showlegend: false,
      fill: 'none',
      x: [line.x1, line.x2],
      y: [line.y1, line.y2],
      line: {
        color: line.color,
        width: plotSettings.plotLineWidth,
      },
    }));
  }

  buildAreaTraces(plot: Plot, plotSettings: PlotSettings): Partial<PlotData>[] {
    if (!plot.areas.length) return [];

    const areaFills = plot.areas.map<Partial<PlotData>>(area => ({
      type: 'scatter',
      mode: 'lines',
      showlegend: false,
      fillcolor: hexToRgba(area.color, 0.7),
      fill: 'toself',
      x: [...area.points, area.points[0]].map(point => point.x),
      y: [...area.points, area.points[0]].map(point => point.y),
      line: {
        width: plotSettings.zeroLineWidth,
        color: plotSettings.zeroLineColor,
      },
    }));

    return [...areaFills, ...this.buildAreaPointMarkerTraces(plot)];
  }

  calculateLabelPosition(
    point: AreaPoint,
    polygonPoints: AreaPoint[],
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

  private buildAreaPointMarkerTraces(plot: Plot): Partial<PlotData>[] {
    const areaPointMarkers: {
      x: number;
      y: number;
      text: string;
      textposition: Exclude<LabelPosition, 'auto'>;
    }[] = [];

    for (const area of plot.areas) {
      if (!area.showPoints) continue;

      for (const point of area.points) {
        const position =
          point.labelPosition !== 'auto'
            ? point.labelPosition
            : this.calculateLabelPosition(point, area.points);
        areaPointMarkers.push({
          x: point.x,
          y: point.y,
          text: point.labelText,
          textposition: position,
        });
      }
    }

    if (!areaPointMarkers.length) return [];

    const groupedByPosition = new Map<
      Exclude<LabelPosition, 'auto'>,
      typeof areaPointMarkers
    >();

    for (const marker of areaPointMarkers) {
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
}
