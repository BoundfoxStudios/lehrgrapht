import { Injectable, Signal, signal } from '@angular/core';
import { Plot } from '../models/plot';

export interface WordPlot {
  officeId: number;
  id: string;
  model?: Plot;
}

export const modelIdPrefix = 'plot-';

export abstract class WordService {
  abstract selection: Signal<WordPlot | undefined>;

  abstract list(): Promise<WordPlot[]>;

  abstract delete(officeId: number): Promise<void>;

  abstract select(officeId: number): Promise<void>;

  abstract get(officeId: number): Promise<Required<WordPlot> | undefined>;

  abstract upsertPicture(options: {
    base64Picture: string;
    height: number;
    width: number;
    id: string;
    model: Plot;
    existingShapeOfficeId?: number;
  }): Promise<number>;
}

@Injectable()
export class WordServiceImpl extends WordService {
  readonly selection = signal<WordPlot | undefined>(undefined, {
    equal: (a, b) => a?.id === b?.id,
  });

  // constructor() {
  //   super();

  // This will currently make some issues with the plot editor....
  // timer(1000, 1000)
  //   .pipe(
  //     takeUntilDestroyed(),
  //     exhaustMap(async () =>
  //       Word.run(async context => {
  //         const range = context.document.getSelection();
  //         const shapes = range.shapes.load('items');
  //         await context.sync();
  //
  //         if (!shapes.items.length) {
  //           return;
  //         }
  //
  //         return await this.get(shapes.items[0].id);
  //       }),
  //     ),
  //   )
  //   .subscribe(plot => {
  //     this.selection.set(plot);
  //   });
  // }

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
  readonly selection: Signal<WordPlot | undefined> = signal(undefined);

  async list(): Promise<WordPlot[]> {
    return Promise.resolve([]);
  }

  async select(_officeId: number): Promise<void> {
    // noop.
  }

  get(_officeId: number): Promise<Required<WordPlot> | undefined> {
    return Promise.resolve(undefined);
  }

  async delete(_officeId: number): Promise<void> {
    // noop.
  }

  async upsertPicture(_options: {
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
