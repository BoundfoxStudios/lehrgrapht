import {
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Header } from '../header/header';
import { Field, form, SchemaPath, validate } from '@angular/forms/signals';
import { PlotPreview } from '../plot-preview/plot-preview';
import { plotHasErrorCode, PlotService } from '../../services/plot.service';
import { FormsModule } from '@angular/forms';
import { ContentContainer } from '../content-container/content-container';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlusCircle, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { MathDisplay } from '../math-display/math-display';
import { Plot, PlotSettings } from '../../models/plot';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { WordService } from '../../services/word/word.service';
import { Section } from '../section/section';
import { Accordion } from '../accordion/accordion';
import { AccordionPanel } from '../accordion/accordion-panel/accordion-panel';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';

const colors = ['#3737d0', '#af2c2c', '#2a8c1a', '#f18238'];

const lessThanValidator = (
  fieldA: SchemaPath<number>,
  fieldB: SchemaPath<number>,
  message: string,
): void => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/unbound-method
  validate(fieldA, ({ value, valueOf }) => {
    const fieldAValue = value();
    const fieldBValue = valueOf(fieldB);

    if (fieldAValue >= fieldBValue) {
      return {
        field: fieldA,
        message,
        kind: 'lessThan',
      };
    }

    return null;
  });
};

@Component({
  selector: 'lg-plot-editor',
  imports: [
    Header,
    Field,
    PlotPreview,
    FormsModule,
    ContentContainer,
    FaIconComponent,
    MathDisplay,
    Section,
    Accordion,
    AccordionPanel,
  ],
  templateUrl: './plot-editor.html',
  styleUrl: './plot-editor.css',
})
export class PlotEditor {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;

  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly wordService = inject(WordService);
  private readonly router = inject(Router);

  protected readonly plotSettings = signal<PlotSettings>(defaultPlotSettings);

  protected readonly activeId = toSignal(
    this.activatedRoute.paramMap.pipe(map(params => params.get('id'))),
  );

  protected readonly existingPlot = resource({
    params: () => this.activeId(),
    loader: ({ params }) =>
      params ? this.wordService.get(params) : Promise.resolve(undefined),
  });

  protected readonly editorModel = signal<Plot>({
    name: 'Neuer Plot',
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
        color: colors[0],
      },
    ],
    markers: [],
    lines: [],
    areas: [],
    showAxis: true,
    showAxisLabels: true,
    placeAxisLabelsInside: true,
    squarePlots: false,
    automaticallyAdjustLimitsToValueRange: false,
  });

  protected readonly squareCount = computed(
    () =>
      `${(this.editorModel().range.x.max - this.editorModel().range.x.min) * 2} / ${(this.editorModel().range.y.max - this.editorModel().range.y.min) * 2}`,
  );

  protected readonly rangeTitle = computed(() => {
    const range = this.editorModel().range;

    return `Grenzen (x: ${range.x.min}/${range.x.max}, y: ${range.y.min}/${range.y.max}) (K: ${this.squareCount()})`;
  });

  protected readonly functionsTitle = computed(() => {
    const fnx = this.editorModel().fnx;

    return `Funktionen (Anzahl: ${fnx.length})`;
  });

  protected readonly markersTitle = computed(() => {
    const markers = this.editorModel().markers;

    return `Punkte (x/y) (Anzahl: ${markers.length})`;
  });

  protected readonly areasTitle = computed(() => {
    const areas = this.editorModel().areas;

    return `Flächen (Anzahl: ${areas.length})`;
  });

  protected readonly linesTitle = computed(() => {
    const lines = this.editorModel().lines;

    return `Linien (Anzahl: ${lines.length})`;
  });

  protected readonly editorForm = form(this.editorModel, schema => {
    lessThanValidator(
      schema.range.x.min,
      schema.range.x.max,
      'X Min muss kleiner sein als X Max',
    );
    lessThanValidator(
      schema.range.y.min,
      schema.range.y.max,
      'Y Min muss kleiner sein als Y Max',
    );
  });

  constructor() {
    this.plotSettings.set(this.plotSettingsService.get());

    effect(() => {
      const existingPlot = this.existingPlot.value();

      if (existingPlot) {
        this.editorModel.set(existingPlot.model);
      }
    });
  }

  protected async sendToWord(): Promise<void> {
    const existingPlot = this.existingPlot.value();

    const model = this.editorModel();
    const plot = await this.plotService.generate(model, this.plotSettings(), {
      applyScaleFactor:
        this.wordService.plotGenerationSettings.applyScaleFactor,
    });

    if (plotHasErrorCode(plot)) {
      return;
    }

    const id = existingPlot ? existingPlot.id : this.plotService.generateId();
    await this.wordService.upsertPicture({
      model,
      id,
      base64Picture: plot.base64,
      existingId: existingPlot?.id,
      height: plot.heightInPoints,
      width: plot.widthInPoints,
    });

    void this.router.navigate(['/plot/editor', id]);
  }

  protected removeFx(index: number): void {
    this.editorModel.update(model => {
      const fnx = [...model.fnx];
      fnx.splice(index, 1);
      return { ...model, fnx };
    });
  }

  protected addFx(): void {
    this.editorModel.update(model => ({
      ...model,
      fnx: [
        ...model.fnx,
        { fnx: 'x', color: colors[model.fnx.length % colors.length] },
      ],
    }));
  }

  protected addMarker(): void {
    this.editorModel.update(model => ({
      ...model,
      markers: [...model.markers, { x: 0, y: 0, text: 'P' }],
    }));
  }

  protected removeMarker(index: number): void {
    this.editorModel.update(model => {
      const markers = [...model.markers];
      markers.splice(index, 1);
      return { ...model, markers };
    });
  }

  protected addLine(): void {
    this.editorModel.update(model => ({
      ...model,
      lines: [
        ...model.lines,
        {
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          color: colors[model.lines.length % colors.length],
        },
      ],
    }));
  }

  protected removeLine(index: number): void {
    this.editorModel.update(model => {
      const lines = [...model.lines];
      lines.splice(index, 1);
      return { ...model, lines };
    });
  }

  protected addArea(): void {
    this.editorModel.update(model => ({
      ...model,
      areas: [
        ...model.areas,
        {
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ],
          color: colors[model.areas.length % colors.length],
        },
      ],
    }));
  }

  protected removeArea(index: number): void {
    this.editorModel.update(model => {
      const areas = [...model.areas];
      areas.splice(index, 1);
      return { ...model, areas };
    });
  }

  protected addAreaPoint(areaIndex: number): void {
    this.editorModel.update(model => {
      const areas = model.areas.map((area, i) =>
        i === areaIndex
          ? { ...area, points: [...area.points, { x: 0, y: 0 }] }
          : area,
      );
      return { ...model, areas };
    });
  }

  protected removeAreaPoint(areaIndex: number, pointIndex: number): void {
    this.editorModel.update(model => {
      const areas = model.areas.map((area, i) => {
        if (i !== areaIndex) return area;
        const points = [...area.points];
        points.splice(pointIndex, 1);
        return { ...area, points };
      });
      return { ...model, areas };
    });
  }

  protected autoAdjustLimits(): void {
    const lines = this.editorModel().lines;
    const markers = this.editorModel().markers;
    const areas = this.editorModel().areas;

    const allPoints: { x: number; y: number }[] = [];

    for (const line of lines) {
      allPoints.push({ x: line.x1, y: line.y1 });
      allPoints.push({ x: line.x2, y: line.y2 });
    }

    // Add marker points
    for (const marker of markers) {
      allPoints.push({ x: marker.x, y: marker.y });
    }

    // Add area points
    for (const area of areas) {
      allPoints.push(...area.points);
    }

    if (!allPoints.length) {
      return;
    }

    let minX = allPoints[0].x;
    let maxX = allPoints[0].x;
    let minY = allPoints[0].y;
    let maxY = allPoints[0].y;

    for (const point of allPoints) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }

    this.editorModel.update(model => ({
      ...model,
      range: {
        x: { min: minX - 1, max: maxX + 1 },
        y: { min: minY - 1, max: maxY + 1 },
      },
    }));
  }
}
