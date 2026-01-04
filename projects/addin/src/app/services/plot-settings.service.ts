import { Injectable } from '@angular/core';
import { PlotSettings } from '../models/plot';

export const defaultPlotSettings: PlotSettings = {
  plotLineWidth: 2.5,
  zeroLineColor: '#444444',
  zeroLineWidth: 1.5,
  gridLineWidth: 1.5,
  gridLineColor: '#a6a6a6',
};

const plotSettingsKey = 'plot-settings';

@Injectable({ providedIn: 'root' })
export class PlotSettingsService {
  set(settings: PlotSettings): void {
    localStorage.setItem(plotSettingsKey, JSON.stringify(settings));
  }

  get(): PlotSettings {
    const item = localStorage.getItem(plotSettingsKey);
    return item ? (JSON.parse(item) as PlotSettings) : defaultPlotSettings;
  }
}
