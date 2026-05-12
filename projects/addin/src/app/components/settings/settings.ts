import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Header } from '../header/header';
import {
  LegendLabelFormat,
  MarkerNamingScheme,
  Plot,
  PlotSettings,
} from '../../models/plot';
import { form, FormField, min } from '@angular/forms/signals';
import { ContentContainer } from '../content-container/content-container';
import { PlotPreview } from '../plot-preview/plot-preview';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';
import { lehrgraphtVersion } from '../../../version';
import { Input } from '../../ui/input/input';

interface SegmentOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'lg-settings',
  imports: [Header, ContentContainer, PlotPreview, FormField, Input],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly plotSettingsService = inject(PlotSettingsService);

  protected readonly markerNamingSchemeOptions: SegmentOption<MarkerNamingScheme>[] =
    [
      { value: 'alphabetic', label: 'A, B, C, …' },
      { value: 'numeric', label: 'P1, P2, P3, …' },
    ];

  protected readonly legendLabelFormatOptions: SegmentOption<LegendLabelFormat>[] =
    [
      { value: 'none', label: 'Keine' },
      { value: 'f(x)=', label: 'f(x)=' },
      { value: 'y=', label: 'y=' },
    ];

  protected readonly editorModel = signal<PlotSettings>(defaultPlotSettings);

  protected readonly editorForm = form(this.editorModel, schema => {
    min(schema.zeroLineWidth, 1);
    min(schema.gridLineWidth, 1);
    min(schema.plotLineWidth, 1);
  });

  protected readonly examplePlot1: Plot = {
    version: lehrgraphtVersion,
    name: 'Beispiel',
    range: {
      x: { min: -3, max: 3 },
      y: { min: -3, max: 3 },
    },
    fnx: [
      {
        fnx: 'x',
        color: '#3737d0',
        legendPosition: 'none',
        lineStyle: 'solid',
      },
      {
        fnx: 'x^2-3',
        color: '#af2c2c',
        legendPosition: 'none',
        lineStyle: 'solid',
      },
    ],
    markers: [],
    polygons: [],
    showAxis: true,
    showAxisLabels: true,
    placeAxisLabelsInside: true,
    squarePlots: false,
    automaticallyAdjustLimitsToValueRange: false,
    axisLabelX: 'x',
    axisLabelY: 'y',
    legendLabelFormat: 'none',
    showAxisArrows: false,
    gridStep: '1',
    aspectRatio: 'auto',
    background: 'white',
  };

  protected readonly examplePlot2: Plot = {
    ...this.examplePlot1,
    placeAxisLabelsInside: false,
  };

  constructor() {
    this.editorModel.set(this.plotSettingsService.get());

    effect(() => {
      this.plotSettingsService.set(this.editorModel());
    });
  }

  protected setMarkerNamingScheme(value: MarkerNamingScheme): void {
    this.editorModel.update(s => ({ ...s, markerNamingScheme: value }));
  }

  protected setLegendLabelFormat(value: LegendLabelFormat): void {
    this.editorModel.update(s => ({ ...s, legendLabelFormat: value }));
  }
}
