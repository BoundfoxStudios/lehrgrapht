import { Injectable } from '@angular/core';
import { Plot } from '../models/plot';

export interface WordPlot {
  officeId: number;
  id: string;
  model?: Plot;
}

export const modelIdPrefix = 'plot-';

@Injectable()
export class WordService {
  async list(): Promise<WordPlot[]> {
    return Word.run(async context => {
      const images = context.document.body.shapes.load('items');
      await context.sync();

      const result: WordPlot[] = [];

      for (const image of images.items) {
        const plot = await this.get(image.id);
        if (!plot) {
          continue;
        }

        result.push(plot);
      }

      return result;
    });
  }

  async delete(officeId: number): Promise<void> {
    await Word.run(async context => {
      const plot = await this.get(officeId);

      if (!plot) {
        return;
      }

      context.document.body.shapes.getById(plot.officeId).delete();

      Office.context.document.settings.remove(plot.id);
      Office.context.document.settings.saveAsync();
      await context.sync();
    });
  }

  async select(officeId: number): Promise<void> {
    await Word.run(async context => {
      const shape = context.document.body.shapes.getById(officeId);
      await context.sync();
      shape.select();
      await context.sync();
    });
  }

  async get(officeId: number): Promise<Required<WordPlot> | undefined> {
    return Word.run(async context => {
      const shape = context.document.body.shapes.getById(officeId);
      shape.load();
      await context.sync();

      if (!shape.altTextDescription.startsWith(modelIdPrefix)) {
        return;
      }

      const model = Office.context.document.settings.get(
        shape.altTextDescription,
      ) as Plot | undefined;

      if (!model) {
        return;
      }

      const result: Required<WordPlot> = {
        model,
        id: shape.altTextDescription,
        officeId,
      };

      return result;
    });
  }

  async upsertPicture(options: {
    base64Picture: string;
    height: number;
    width: number;
    id: string;
    model: Plot;
    existingShapeOfficeId?: number;
  }): Promise<number> {
    return await Word.run(async context => {
      let top: number | undefined;
      let left: number | undefined;

      if (options.existingShapeOfficeId) {
        const oldShape = context.document.body.shapes
          .getById(options.existingShapeOfficeId)
          .load();
        await context.sync();

        top = oldShape.top;
        left = oldShape.left;

        oldShape.delete();
      }

      const range = context.document.getSelection();

      const picture = range.insertPictureFromBase64(options.base64Picture, {
        width: options.width,
        height: options.height,
        top,
        left,
      });
      picture.altTextDescription = options.id;
      await context.sync();

      Office.context.document.settings.set(options.id, options.model);
      Office.context.document.settings.saveAsync();

      return picture.id;
    });
  }
}

@Injectable()
export class NoOpWordService extends WordService {
  override async list(): Promise<WordPlot[]> {
    return Promise.resolve([]);
  }

  override async select(_officeId: number): Promise<void> {
    // noop.
  }

  override get(_officeId: number): Promise<Required<WordPlot> | undefined> {
    return Promise.resolve(undefined);
  }

  override async delete(_officeId: number): Promise<void> {
    // noop.
  }

  override async upsertPicture(_options: {
    base64Picture: string;
    height: number;
    width: number;
    id: string;
    model: Plot;
    existingShapeOfficeId?: number;
  }): Promise<number> {
    return Promise.resolve(0);
  }
}
