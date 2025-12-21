import { Component, effect, inject, resource, signal } from '@angular/core';
import { Header } from '../header/header';
import { Field, form, SchemaPath, validate } from '@angular/forms/signals';
import { PlotPreview } from '../plot-preview/plot-preview';
import { PlotService } from '../../services/plot.service';
import { FormsModule } from '@angular/forms';
import { v7 } from 'uuid';
import { ContentContainer } from '../content-container/content-container';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlusCircle, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { MathDisplay } from '../math-display/math-display';
import { Plot } from '../../models/plot';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { modelIdPrefix, WordService } from '../../services/word/word.service';
import { Section } from '../section/section';

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
  ],
  templateUrl: './plot-editor.html',
  styleUrl: './plot-editor.css',
})
export class PlotEditor {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;

  private readonly plotService = inject(PlotService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly wordService = inject(WordService);
  private readonly router = inject(Router);

  protected readonly activeId = toSignal(
    this.activatedRoute.paramMap.pipe(map(params => params.get('id'))),
  );

  protected readonly existingPlot = resource({
    params: () => this.activeId(),
    loader: ({ params }) =>
      params ? this.wordService.get(params) : Promise.resolve(undefined),
  });

  protected editorModel = signal<Plot>({
    name: 'Neuer Plot',
    range: {
      x: {
        min: -6,
        max: 6,
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
    showAxisLabels: true,
    placeAxisLabelsInside: false,
  });

  protected editorForm = form(this.editorModel, schema => {
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
    const plot = await this.plotService.generate(model, {
      applyScaleFactor:
        this.wordService.plotGenerationSettings.applyScaleFactor,
    });

    if (!plot) {
      return;
    }

    const wordImage = plot.base64.substring('data:image/png;base64,'.length);

    const id = existingPlot ? existingPlot.id : `${modelIdPrefix}${v7()}`;
    await this.wordService.upsertPicture({
      model,
      id,
      base64Picture: wordImage,
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
}
