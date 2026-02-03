import { PlotRange } from './plot-range';

export interface MathFunction {
  fnx: string;
  color: string;
}

export type MarkerNamingScheme = 'alphabetic' | 'numeric';

export interface PlotSettings {
  zeroLineWidth: number;
  zeroLineColor: string;
  gridLineWidth: number;
  gridLineColor: string;
  plotLineWidth: number;
  markerNamingScheme: MarkerNamingScheme;
}

export interface Plot {
  name: string;
  range: PlotRange;
  fnx: MathFunction[];
  markers: {
    x: number;
    y: number;
    text: string;
  }[];
  areas: {
    points: { x: number; y: number }[];
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
}
