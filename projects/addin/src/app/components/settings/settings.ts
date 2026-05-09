import { Component, effect, inject, signal } from '@angular/core';
import { Header } from '../header/header';
import {
  LegendLabelFormat,
  MarkerNamingScheme,
  Plot,
  PlotSettings,
} from '../../models/plot';
import { form, FormField, min } from '@angular/forms/signals';
import { Accordion } from '../accordion/accordion';
import { AccordionPanel } from '../accordion/accordion-panel/accordion-panel';
import { ContentContainer } from '../content-container/content-container';
import { PlotPreview } from '../plot-preview/plot-preview';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';
import { Dropdown, DropdownOption } from '../dropdown/dropdown';
import { lehrgraphtVersion } from '../../../version';

@Component({
  selector: 'lg-settings',
  imports: [
    Header,
    Accordion,
    AccordionPanel,
    ContentContainer,
    PlotPreview,
    Dropdown,
    FormField,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly plotSettingsService = inject(PlotSettingsService);

  protected readonly markerNamingSchemeOptions: DropdownOption<MarkerNamingScheme>[] =
    [
      { value: 'alphabetic', label: 'Alphabetisch (A, B, C, ...)' },
      { value: 'numeric', label: 'Numerisch (P1, P2, P3, ...)' },
    ];

  protected readonly legendLabelFormatOptions: DropdownOption<LegendLabelFormat>[] =
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
      x: {
        min: -3,
        max: 3,
      },
      y: {
        min: -3,
        max: 3,
      },
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
    areas: [],
    lines: [],
    showAxis: true,
    showAxisLabels: true,
    placeAxisLabelsInside: true,
    squarePlots: false,
    automaticallyAdjustLimitsToValueRange: false,
    axisLabelX: 'x',
    axisLabelY: 'y',
    legendLabelFormat: 'none',
  };

  protected readonly examplePlot2: Plot = {
    version: lehrgraphtVersion,
    name: 'Beispiel',
    range: {
      x: {
        min: -3,
        max: 3,
      },
      y: {
        min: -3,
        max: 3,
      },
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
    lines: [],
    areas: [],
    showAxis: true,
    showAxisLabels: true,
    placeAxisLabelsInside: false,
    squarePlots: false,
    automaticallyAdjustLimitsToValueRange: false,
    axisLabelX: 'x',
    axisLabelY: 'y',
    legendLabelFormat: 'none',
  };

  constructor() {
    this.editorModel.set(this.plotSettingsService.get());

    effect(() => {
      this.plotSettingsService.set(this.editorModel());
    });
  }
}
