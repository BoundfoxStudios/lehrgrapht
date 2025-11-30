import { Component, effect, inject, resource, signal } from '@angular/core';
import { Header } from '../header/header';
import { Field, form } from '@angular/forms/signals';
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
import { modelIdPrefix, WordService } from '../../services/word.service';

const colors = ['#3737d0', '#af2c2c', '#2a8c1a', '#f18238'];

@Component({
  selector: 'app-plot-editor',
  imports: [
    Header,
    Field,
    PlotPreview,
    FormsModule,
    ContentContainer,
    FaIconComponent,
    MathDisplay,
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
    this.activatedRoute.paramMap.pipe(map(params => params.get('officeId'))),
  );

  protected readonly existingPlot = resource({
    params: () => this.activeId(),
    loader: ({ params }) =>
      params ? this.wordService.get(+params) : Promise.resolve(undefined),
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
    showAxisLabels: true,
    placeAxisLabelsInside: false,
  });

  protected editorForm = form(this.editorModel);

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
    const plot = await this.plotService.generate({
      fnx: model.fnx,
      range: model.range,
      showAxisLabels: model.showAxisLabels,
      placeAxisLabelsInside: model.placeAxisLabelsInside,
    });

    if (!plot) {
      return;
    }

    const wordImage = plot.base64.substring('data:image/png;base64,'.length);

    const newId = await this.wordService.upsertPicture({
      model,
      id: existingPlot ? existingPlot.id : `${modelIdPrefix}${v7()}`,
      base64Picture: wordImage,
      existingShapeOfficeId: existingPlot?.officeId,
      height: plot.heightInPoints,
      width: plot.widthInPoints,
    });

    void this.router.navigate(['/plot/editor', newId]);
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
}
