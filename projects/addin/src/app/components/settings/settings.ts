import { Component, effect, inject, signal } from '@angular/core';
import { Header } from '../header/header';
import { MarkerNamingScheme, Plot, PlotSettings } from '../../models/plot';
import { Field, form, min } from '@angular/forms/signals';
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
    Field,
    PlotPreview,
    Dropdown,
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
      },
      {
        fnx: 'x^2-3',
        color: '#af2c2c',
        legendPosition: 'none',
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
      },
      {
        fnx: 'x^2-3',
        color: '#af2c2c',
        legendPosition: 'none',
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
  };

  constructor() {
    this.editorModel.set(this.plotSettingsService.get());

    effect(() => {
      this.plotSettingsService.set(this.editorModel());
    });
  }
}
