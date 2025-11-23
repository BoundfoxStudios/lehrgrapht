import { PlotRange } from './plot-range';
import { MathFunction } from '../services/plot.service';

export interface Plot {
  name: string;
  range: PlotRange;
  fnx: MathFunction[];
  showAxisLabels: boolean;
  placeAxisLabelsInside: boolean;
}
