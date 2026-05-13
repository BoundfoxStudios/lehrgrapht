import { PlotRange } from './plot-range';

export type FunctionLegendPosition = 'none' | 'start' | 'end';

export type LegendLabelFormat = 'none' | 'f(x)=' | 'y=';

export type FunctionLineStyle = 'solid' | 'dashed';

export type GridStep = '0.5' | '1';
export type PolygonFillStyle = 'solid' | 'hatched' | 'outline';

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
  fillStyle: PolygonFillStyle;
  isSolution: boolean;
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

export interface ReflectionPoint {
  x: number;
  y: number;
}

export interface ReflectionAxis {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

export type Reflection =
  | { kind: 'none' }
  | { kind: 'point'; point: ReflectionPoint; isSolution: boolean }
  | {
      kind: 'axis';
      axis: ReflectionAxis;
      isSolution: boolean;
      color: string;
      lineStyle: FunctionLineStyle;
      extendBeyondPoints: boolean;
    };

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
  polygons: Polygon[];
  showAxisLabels: boolean;
  showAxis: boolean;
  placeAxisLabelsInside: boolean;
  squarePlots: boolean;
  automaticallyAdjustLimitsToValueRange: boolean;
  axisLabelX: string;
  axisLabelY: string;
  legendLabelFormat: LegendLabelFormat;
  showAxisArrows: boolean;
  gridStep: GridStep;
  reflection: Reflection;
}
