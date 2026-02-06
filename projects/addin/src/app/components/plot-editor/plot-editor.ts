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
import { PlotClickEvent, PlotPreview } from '../plot-preview/plot-preview';
import {
  plotHasErrorCode,
  PlotService,
  PlotSizeMm,
} from '../../services/plot.service';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentContainer } from '../content-container/content-container';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { MathDisplay } from '../math-display/math-display';
import { Plot, PlotSettings } from '../../models/plot';
import { lehrgraphtVersion } from '../../../version';
import { MarkerNamingService } from '../../services/marker-naming.service';
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
import { Dropdown, DropdownOption } from '../dropdown/dropdown';
import { LabelPosition } from '../../models/plot';

const colors = ['#3737d0', '#af2c2c', '#2a8c1a', '#f18238'];

enum InteractiveMode {
  Off = 'off',
  Area = 'area',
  Marker = 'marker',
  Line = 'line',
  StraightLine = 'straightLine',
}

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
    Dropdown,
    DecimalPipe,
  ],
  templateUrl: './plot-editor.html',
  styleUrl: './plot-editor.css',
})
export class PlotEditor {
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly faCheck = faCheck;

  protected readonly labelPositionOptions: DropdownOption<LabelPosition>[] = [
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

  private readonly plotService = inject(PlotService);
  protected readonly markerNamingService = inject(MarkerNamingService);
  private readonly plotSettingsService = inject(PlotSettingsService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly wordService = inject(WordService);
  private readonly router = inject(Router);

  protected readonly plotSettings = signal<PlotSettings>(defaultPlotSettings);

  protected readonly interactiveMode = signal<InteractiveMode>(
    InteractiveMode.Off,
  );
  protected readonly interactivePoints = signal<{ x: number; y: number }[]>([]);

  protected readonly activeId = toSignal(
    this.activatedRoute.paramMap.pipe(map(params => params.get('id'))),
  );

  protected readonly existingPlot = resource({
    params: () => this.activeId(),
    loader: ({ params }) =>
      params ? this.wordService.get(params) : Promise.resolve(undefined),
  });

  protected readonly editorModel = signal<Plot>({
    version: lehrgraphtVersion,
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
    axisLabelX: 'x',
    axisLabelY: 'y',
  });

  protected readonly squareCount = computed(
    () =>
      `${(this.editorModel().range.x.max - this.editorModel().range.x.min) * 2} / ${(this.editorModel().range.y.max - this.editorModel().range.y.min) * 2}`,
  );

  protected readonly plotSizeMm = computed<PlotSizeMm>(() =>
    this.plotService.calculatePlotSizeMm(this.editorModel()),
  );

  protected readonly isAnyInteractiveMode = computed(
    () => this.interactiveMode() !== InteractiveMode.Off,
  );

  protected readonly previewModel = computed(() => {
    const model = this.editorModel();
    const mode = this.interactiveMode();
    const scheme = this.plotSettings().markerNamingScheme;

    let areas = model.areas;
    let markers = model.markers;
    let lines = model.lines;

    const pts = this.interactivePoints();

    if (mode === InteractiveMode.Area && pts.length > 0) {
      const startIndex = this.getNextLabelIndex();
      areas = [
        ...areas,
        {
          points: pts.map((p, i) => ({
            ...p,
            labelPosition: 'auto' as const,
            labelText: this.markerNamingService.generateName(
              startIndex + i,
              scheme,
            ),
          })),
          color: colors[areas.length % colors.length],
          showPoints: false,
        },
      ];
    }

    if (mode === InteractiveMode.Marker && pts.length > 0) {
      markers = [
        ...markers,
        ...pts.map((p, i) => ({
          ...p,
          text: this.markerNamingService.generateName(
            markers.length + i,
            scheme,
          ),
        })),
      ];
    }

    if (mode === InteractiveMode.Line && pts.length === 2) {
      lines = [
        ...lines,
        {
          x1: pts[0].x,
          y1: pts[0].y,
          x2: pts[1].x,
          y2: pts[1].y,
          color: colors[lines.length % colors.length],
        },
      ];
    }

    let fnx = model.fnx;

    if (mode === InteractiveMode.StraightLine && pts.length === 2) {
      const fnxString = this.calculateStraightLineFunction(pts[0], pts[1]);
      if (fnxString) {
        fnx = [
          ...fnx,
          {
            fnx: fnxString,
            color: colors[fnx.length % colors.length],
          },
        ];
      }
    }

    return { ...model, areas, markers, lines, fnx };
  });

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
    const scheme = this.plotSettings().markerNamingScheme;
    this.editorModel.update(model => ({
      ...model,
      markers: [
        ...model.markers,
        {
          x: 0,
          y: 0,
          text: this.markerNamingService.generateName(
            model.markers.length,
            scheme,
          ),
        },
      ],
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
    const scheme = this.plotSettings().markerNamingScheme;
    const startIndex = this.getNextLabelIndex();
    this.editorModel.update(model => ({
      ...model,
      areas: [
        ...model.areas,
        {
          points: [
            {
              x: 0,
              y: 0,
              labelPosition: 'auto',
              labelText: this.markerNamingService.generateName(
                startIndex,
                scheme,
              ),
            },
            {
              x: 1,
              y: 0,
              labelPosition: 'auto',
              labelText: this.markerNamingService.generateName(
                startIndex + 1,
                scheme,
              ),
            },
            {
              x: 1,
              y: 1,
              labelPosition: 'auto',
              labelText: this.markerNamingService.generateName(
                startIndex + 2,
                scheme,
              ),
            },
          ],
          color: colors[model.areas.length % colors.length],
          showPoints: false,
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
    const scheme = this.plotSettings().markerNamingScheme;
    const nextIndex = this.getNextLabelIndex();
    this.editorModel.update(model => {
      const areas = model.areas.map((area, i) =>
        i === areaIndex
          ? {
              ...area,
              points: [
                ...area.points,
                {
                  x: 0,
                  y: 0,
                  labelPosition: 'auto' as const,
                  labelText: this.markerNamingService.generateName(
                    nextIndex,
                    scheme,
                  ),
                },
              ],
            }
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

    for (const marker of markers) {
      allPoints.push({ x: marker.x, y: marker.y });
    }

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

  protected startInteractiveArea(): void {
    this.interactiveMode.set(InteractiveMode.Area);
    this.interactivePoints.set([]);
  }

  protected cancelInteractiveArea(): void {
    this.interactiveMode.set(InteractiveMode.Off);
    this.interactivePoints.set([]);
  }

  protected finishInteractiveArea(): void {
    const points = this.interactivePoints();

    if (points.length >= 3) {
      const scheme = this.plotSettings().markerNamingScheme;
      const startIndex = this.getNextLabelIndex();
      this.editorModel.update(model => ({
        ...model,
        areas: [
          ...model.areas,
          {
            points: points.map((p, i) => ({
              ...p,
              labelPosition: 'auto' as const,
              labelText: this.markerNamingService.generateName(
                startIndex + i,
                scheme,
              ),
            })),
            color: colors[model.areas.length % colors.length],
            showPoints: false,
          },
        ],
      }));
    }

    this.interactiveMode.set(InteractiveMode.Off);
    this.interactivePoints.set([]);
  }

  protected onPlotClick(event: PlotClickEvent): void {
    const mode = this.interactiveMode();

    if (mode === InteractiveMode.Area || mode === InteractiveMode.Marker) {
      this.interactivePoints.update(points => [...points, event]);
      return;
    }

    if (mode === InteractiveMode.Line) {
      this.interactivePoints.update(points => {
        const newPoints = [...points, event];
        if (newPoints.length === 2) {
          this.editorModel.update(model => ({
            ...model,
            lines: [
              ...model.lines,
              {
                x1: newPoints[0].x,
                y1: newPoints[0].y,
                x2: newPoints[1].x,
                y2: newPoints[1].y,
                color: colors[model.lines.length % colors.length],
              },
            ],
          }));
          this.interactiveMode.set(InteractiveMode.Off);
          return [];
        }
        return newPoints;
      });
      return;
    }

    if (mode === InteractiveMode.StraightLine) {
      this.interactivePoints.update(points => {
        const newPoints = [...points, event];
        if (newPoints.length === 2) {
          const [p1, p2] = newPoints;
          const fnxString = this.calculateStraightLineFunction(p1, p2);

          if (fnxString) {
            this.editorModel.update(model => ({
              ...model,
              fnx: [
                ...model.fnx,
                {
                  fnx: fnxString,
                  color: colors[model.fnx.length % colors.length],
                },
              ],
            }));
          }

          this.interactiveMode.set(InteractiveMode.Off);
          return [];
        }
        return newPoints;
      });
      return;
    }
  }

  protected removeInteractivePoint(index: number): void {
    this.interactivePoints.update(points => {
      const newPoints = [...points];
      newPoints.splice(index, 1);
      return newPoints;
    });
  }

  protected startInteractiveMarker(): void {
    this.interactiveMode.set(InteractiveMode.Marker);
    this.interactivePoints.set([]);
  }

  protected cancelInteractiveMarker(): void {
    this.interactiveMode.set(InteractiveMode.Off);
    this.interactivePoints.set([]);
  }

  protected finishInteractiveMarker(): void {
    const points = this.interactivePoints();
    const scheme = this.plotSettings().markerNamingScheme;

    if (points.length > 0) {
      this.editorModel.update(model => ({
        ...model,
        markers: [
          ...model.markers,
          ...points.map((p, i) => ({
            ...p,
            text: this.markerNamingService.generateName(
              model.markers.length + i,
              scheme,
            ),
          })),
        ],
      }));
    }

    this.interactiveMode.set(InteractiveMode.Off);
    this.interactivePoints.set([]);
  }

  protected startInteractiveLine(): void {
    this.interactiveMode.set(InteractiveMode.Line);
    this.interactivePoints.set([]);
  }

  protected cancelInteractiveLine(): void {
    this.interactiveMode.set(InteractiveMode.Off);
    this.interactivePoints.set([]);
  }

  protected startInteractiveStraightLine(): void {
    this.interactiveMode.set(InteractiveMode.StraightLine);
    this.interactivePoints.set([]);
  }

  protected cancelInteractiveStraightLine(): void {
    this.interactiveMode.set(InteractiveMode.Off);
    this.interactivePoints.set([]);
  }

  private calculateStraightLineFunction(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ): string | null {
    if (p1.x === p2.x) {
      return null;
    }

    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - m * p1.x;

    const mRounded = Math.round(m * 100) / 100;
    const bRounded = Math.round(b * 100) / 100;

    if (mRounded === 0) {
      return `${bRounded}`;
    }

    const mStr = mRounded === 1 ? '' : mRounded === -1 ? '-' : `${mRounded}*`;

    if (bRounded === 0) {
      return `${mStr}x`;
    }

    const bStr = bRounded > 0 ? `+${bRounded}` : `${bRounded}`;
    return `${mStr}x${bStr}`;
  }

  private getNextLabelIndex(): number {
    const model = this.editorModel();
    let index = 0;
    for (const area of model.areas) {
      if (area.showPoints) {
        index += area.points.length;
      }
    }
    return index;
  }
}
