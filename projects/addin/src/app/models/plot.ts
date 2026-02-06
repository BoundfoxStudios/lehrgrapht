import { PlotRange } from './plot-range';

export interface MathFunction {
  fnx: string;
  color: string;
  showLegend: boolean;
}

export type MarkerNamingScheme = 'alphabetic' | 'numeric';

export type LabelPosition =
  | 'top left'
  | 'top center'
  | 'top right'
  | 'middle left'
  | 'middle right'
  | 'bottom left'
  | 'bottom center'
  | 'bottom right'
  | 'auto';

export interface AreaPoint {
  x: number;
  y: number;
  labelPosition: LabelPosition;
  labelText: string;
}

export interface PlotSettings {
  zeroLineWidth: number;
  zeroLineColor: string;
  gridLineWidth: number;
  gridLineColor: string;
  plotLineWidth: number;
  markerNamingScheme: MarkerNamingScheme;
}

export interface Plot {
  version: string;
  name: string;
  range: PlotRange;
  fnx: MathFunction[];
  markers: {
    x: number;
    y: number;
    text: string;
  }[];
  areas: {
    points: AreaPoint[];
    color: string;
    showPoints: boolean;
  }[];
  lines: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    color: string;
  }[];
  showAxisLabels: boolean;
  showAxis: boolean;
  placeAxisLabelsInside: boolean;
  squarePlots: boolean;
  automaticallyAdjustLimitsToValueRange: boolean;
  axisLabelX: string;
  axisLabelY: string;
}
