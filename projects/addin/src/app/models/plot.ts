import { PlotRange } from './plot-range';

export interface MathFunction {
  fnx: string;
  color: string;
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
  showAxisLabels: boolean;
  placeAxisLabelsInside: boolean;
  squarePlots: boolean;
}
