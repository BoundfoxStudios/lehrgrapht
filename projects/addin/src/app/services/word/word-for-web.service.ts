import { Plot } from '../../models/plot';
import {
  modelIdPrefix,
  PlotGenerationSettings,
  WordPlot,
  WordService,
} from './word.service';
import { inject, Injectable } from '@angular/core';
import { DocumentStorageService } from '../document-storage.service';
import { PlotService } from '../plot/plot.service';
import { plotHasErrorCode } from '../plot/plot.types';
import { PlotSettingsService } from '../plot-settings.service';

@Injectable()
export class WordForWebService extends WordService {
  private readonly documentStorageService = inject(DocumentStorageService);
  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);

  override plotGenerationSettings: PlotGenerationSettings = {
    applyScaleFactor: false,
  };

  override list(): Promise<WordPlot[]> {
    return Word.run(async context => {
      const images = context.document.body.inlinePictures.load('items');
      const plotModels =
        await this.documentStorageService.loadAllPlotsFromContext(
          context,
          modelIdPrefix,
        );

      const result: WordPlot[] = [];
      for (const image of images.items) {
        const model = plotModels.get(image.altTextDescription);
        if (model) {
          result.push({ id: image.altTextDescription, model });
        }
      }
      return result;
    });
  }

  override listRaw(): Promise<(WordPlot | { id: string })[]> {
    return Word.run(async context => {
      const images = context.document.body.inlinePictures.load('items');
      const plotModels =
        await this.documentStorageService.loadAllPlotsFromContext(
          context,
          modelIdPrefix,
        );

      const result: (WordPlot | { id: string })[] = [];
      for (const image of images.items) {
        const model = plotModels.get(image.altTextDescription);
        result.push(
          model
            ? { id: image.altTextDescription, model }
            : { id: image.altTextDescription },
        );
      }
      return result;
    });
  }

  override async delete(id: string): Promise<void> {
    await Word.run(async context => {
      const image = await this.getImage(context, id);

      if (!image) {
        return;
      }

      image.delete();
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
      const image = await this.getImage(context, id);

      if (!image) {
        return;
      }

      image.select();
      await context.sync();
    });
  }

  override get(id: string): Promise<Required<WordPlot> | undefined> {
    return Word.run(async context => {
      const image = await this.getImage(context, id);

      if (!image) {
        return;
      }

      const model = await this.documentStorageService.getPlot(
        image.altTextDescription,
      );

      if (!model) {
        return;
      }

      const result: Required<WordPlot> = {
        model,
        id: image.altTextDescription,
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
      let shouldReplace = false;

      let range: Word.Range | undefined;

      if (options.existingId) {
        const oldImage = await this.getImage(context, options.existingId);

        if (oldImage) {
          oldImage.select();
          await context.sync();

          range = context.document.getSelection();

          shouldReplace = true;
        }
      }

      range ??= context.document.getSelection();
      await context.sync();

      const picture = range.insertInlinePictureFromBase64(
        this.plotService.extractRawPictureDataFromBase64Picture(
          options.base64Picture,
        ),
        shouldReplace ? Word.InsertLocation.replace : Word.InsertLocation.end,
      );
      picture.altTextDescription = options.id;
      await context.sync();

      await this.documentStorageService.setPlot(options.id, options.model);
    });
  }

  private async getImages(
    context: Word.RequestContext,
  ): Promise<Word.InlinePictureCollection> {
    const images = context.document.body.inlinePictures.load('items');
    await context.sync();

    return images;
  }

  private async getImage(
    context: Word.RequestContext,
    id: string,
  ): Promise<Word.InlinePicture | undefined> {
    const images = await this.getImages(context);

    return images.items.find(i => i.altTextDescription === id);
  }
}
