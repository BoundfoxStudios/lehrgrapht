import {
  FunctionLegendPosition,
  FunctionLineStyle,
  LabelPosition,
  LegendLabelFormat,
} from '../../models/plot';
import { DropdownOption } from '../dropdown/dropdown';

export const labelPositionOptions: DropdownOption<LabelPosition>[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'top left', label: 'Oben links' },
  { value: 'top center', label: 'Oben' },
  { value: 'top right', label: 'Oben rechts' },
  { value: 'middle left', label: 'Links' },
  { value: 'middle right', label: 'Rechts' },
  { value: 'bottom left', label: 'Unten links' },
  { value: 'bottom center', label: 'Unten' },
  { value: 'bottom right', label: 'Unten rechts' },
];

export const legendPositionOptions: DropdownOption<FunctionLegendPosition>[] = [
  { value: 'none', label: 'Keine' },
  { value: 'start', label: 'Anfang' },
  { value: 'end', label: 'Ende' },
];

export const lineStyleOptions: DropdownOption<FunctionLineStyle>[] = [
  { value: 'solid', label: 'Durchgezogen' },
  { value: 'dashed', label: 'Gestrichelt' },
];

export const legendLabelFormatOptions: DropdownOption<LegendLabelFormat>[] = [
  { value: 'none', label: 'Keine' },
  { value: 'f(x)=', label: 'f(x)=' },
  { value: 'y=', label: 'y=' },
];
