import { Injectable } from '@angular/core';
import { PlotSettings } from '../models/plot';

export const defaultPlotSettings: PlotSettings = {
  plotLineWidth: 2.5,
  zeroLineColor: '#444444',
  zeroLineWidth: 1.5,
  gridLineWidth: 1.5,
  gridLineColor: '#a6a6a6',
  markerNamingScheme: 'alphabetic',
};

const plotSettingsKey = 'plot-settings';

@Injectable({ providedIn: 'root' })
export class PlotSettingsService {
  set(settings: PlotSettings): void {
    localStorage.setItem(plotSettingsKey, JSON.stringify(settings));
  }

  get(): PlotSettings {
    const item = localStorage.getItem(plotSettingsKey);
    if (!item) {
      return defaultPlotSettings;
    }
    const stored = JSON.parse(item) as Partial<PlotSettings>;
    return { ...defaultPlotSettings, ...stored };
  }
}
