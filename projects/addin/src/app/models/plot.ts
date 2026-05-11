import { PlotRange } from './plot-range';

export type FunctionLegendPosition = 'none' | 'start' | 'end';

export type LegendLabelFormat = 'none' | 'f(x)=' | 'y=';

export type FunctionLineStyle = 'solid' | 'dashed';

export interface MathFunction {
  fnx: string;
  color: string;
  legendPosition: FunctionLegendPosition;
  lineStyle: FunctionLineStyle;
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

export interface PolygonPoint {
  x: number;
  y: number;
  labelPosition: LabelPosition;
  labelText: string;
}

export interface Polygon {
  points: PolygonPoint[];
  connect: boolean;
  lineColor: string;
  fillColor: string | null;
  lineStyle: FunctionLineStyle;
  showPoints: boolean;
}

export interface PlotSettings {
  zeroLineWidth: number;
  zeroLineColor: string;
  gridLineWidth: number;
  gridLineColor: string;
  plotLineWidth: number;
  markerNamingScheme: MarkerNamingScheme;
  legendLabelFormat: LegendLabelFormat;
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
    lineStyle: FunctionLineStyle;
  }[];
  polygons: Polygon[];
  showAxisLabels: boolean;
  showAxis: boolean;
  placeAxisLabelsInside: boolean;
  squarePlots: boolean;
  automaticallyAdjustLimitsToValueRange: boolean;
  axisLabelX: string;
  axisLabelY: string;
  legendLabelFormat: LegendLabelFormat;
}
