import { inject, Injectable } from '@angular/core';
import { Plot } from '../../models/plot';
import {
  modelIdPrefix,
  PlotGenerationSettings,
  WordPlot,
  WordService,
} from './word.service';
import { DocumentStorageService } from '../document-storage.service';
import { PlotService } from '../plot/plot.service';
import { plotHasErrorCode } from '../plot/plot.types';
import { PlotSettingsService } from '../plot-settings.service';

@Injectable()
export class WordForDesktopService extends WordService {
  private readonly documentStorageService = inject(DocumentStorageService);
  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);

  override plotGenerationSettings: PlotGenerationSettings = {
    applyScaleFactor: true,
  };

  override async list(): Promise<WordPlot[]> {
    return Word.run(async context => {
      const shapes = context.document.body.shapes.load('items');
      const plotModels =
        await this.documentStorageService.loadAllPlotsFromContext(
          context,
          modelIdPrefix,
        );

      const result: WordPlot[] = [];
      for (const shape of shapes.items) {
        const model = plotModels.get(shape.altTextDescription);
        if (model) {
          result.push({ id: shape.altTextDescription, model });
        }
      }
      return result;
    });
  }

  override listRaw(): Promise<(WordPlot | { id: string })[]> {
    return Word.run(async context => {
      const shapes = context.document.body.shapes.load('items');
      const plotModels =
        await this.documentStorageService.loadAllPlotsFromContext(
          context,
          modelIdPrefix,
        );

      const result: (WordPlot | { id: string })[] = [];
      for (const shape of shapes.items) {
        const model = plotModels.get(shape.altTextDescription);
        result.push(
          model
            ? { id: shape.altTextDescription, model }
            : { id: shape.altTextDescription },
        );
      }
      return result;
    });
  }

  override async delete(id: string): Promise<void> {
    await Word.run(async context => {
      const shape = await this.getShape(context, { id });

      if (!shape) {
        return;
      }

      shape.delete();

      await this.documentStorageService.remove(id);
      await context.sync();
    });
  }

  override clone(id: string): Promise<string | undefined> {
    return Word.run(async () => {
      const wordPlot = await this.get(id);

      if (!wordPlot) {
        return;
      }

      const clonedWordPlot = JSON.parse(
        JSON.stringify(wordPlot),
      ) as Required<WordPlot>;
      clonedWordPlot.id = this.plotService.generateId();
      clonedWordPlot.model.name += ' (Kopie)';

      const plot = await this.plotService.generate(
        clonedWordPlot.model,
        this.plotSettingsService.get(),
        this.plotGenerationSettings,
      );

      if (plotHasErrorCode(plot)) {
        return;
      }

      await this.upsertPicture({
        model: clonedWordPlot.model,
        id: clonedWordPlot.id,
        base64Picture: plot.base64,
        height: plot.heightInPoints,
        width: plot.widthInPoints,
      });

      return clonedWordPlot.id;
    });
  }

  override async select(id: string): Promise<void> {
    await Word.run(async context => {
      const shape = await this.getShape(context, { id });

      if (!shape) {
        return;
      }

      shape.select();
      await context.sync();
    });
  }

  override async get(id: string): Promise<Required<WordPlot> | undefined> {
    return Word.run(async context => {
      const shape = await this.getShape(context, { id });

      if (!shape) {
        return;
      }

      const model = await this.documentStorageService.getPlot(
        shape.altTextDescription,
      );

      if (!model) {
        return;
      }

      const result: Required<WordPlot> = {
        model,
        id: shape.altTextDescription,
      };

      return result;
    });
  }

  override upsertPicture(options: {
    base64Picture: string;
    height: number;
    width: number;
    id: string;
    model: Plot;
    existingId?: string;
  }): Promise<void> {
    return Word.run(async context => {
      let top: number | undefined;
      let left: number | undefined;
      let restoreSelection: Word.Range | undefined;

      if (options.existingId) {
        const oldShape = await this.getShape(context, {
          id: options.existingId,
        });

        if (oldShape) {
          top = oldShape.top;
          left = oldShape.left;

          restoreSelection = context.document.getSelection();
          restoreSelection.track();
          oldShape.select();
          await context.sync();

          oldShape.delete();
        }
      }

      const range = context.document.getSelection();

      const picture = range.insertPictureFromBase64(
        this.plotService.extractRawPictureDataFromBase64Picture(
          options.base64Picture,
        ),
        {
          width: options.width,
          height: options.height,
          top,
          left,
        },
      );
      picture.altTextDescription = options.id;

      if (restoreSelection) {
        restoreSelection.select();
        restoreSelection.untrack();
      }

      await context.sync();

      await this.documentStorageService.setPlot(options.id, options.model);
    });
  }

  private async getShapes(
    context: Word.RequestContext,
  ): Promise<Word.ShapeCollection> {
    const shapes = context.document.body.shapes.load('items');
    await context.sync();

    return shapes;
  }

  private async getShape(
    context: Word.RequestContext,
    {
      id,
      officeId,
    }: {
      id?: string;
      officeId?: number;
    },
  ): Promise<Word.Shape | undefined> {
    if (!officeId && !id) {
      return;
    }

    if (officeId) {
      const shape = context.document.body.shapes.getById(officeId).load();
      await context.sync();
      return shape.isNullObject ? undefined : shape;
    }

    const shapes = await this.getShapes(context);

    return shapes.items.find(shape => shape.altTextDescription === id);
  }
}
