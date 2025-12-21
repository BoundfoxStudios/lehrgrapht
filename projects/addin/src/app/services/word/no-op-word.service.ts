import { Injectable } from '@angular/core';
import { Plot } from '../../models/plot';
import { PlotGenerationSettings, WordPlot, WordService } from './word.service';

@Injectable()
export class NoOpWordService extends WordService {
  override plotGenerationSettings: PlotGenerationSettings = {
    applyScaleFactor: false,
  };

  override async list(): Promise<WordPlot[]> {
    return Promise.resolve([]);
  }

  override async listRaw(): Promise<(WordPlot | { id: string })[]> {
    return Promise.resolve([]);
  }

  override async select(_id: string): Promise<void> {
    // noop.
  }

  override get(_id: string): Promise<Required<WordPlot> | undefined> {
    return Promise.resolve(undefined);
  }

  override async delete(_id: string): Promise<void> {
    // noop.
  }

  override async upsertPicture(_options: {
    base64Picture: string;
    height: number;
    width: number;
    id: string;
    model: Plot;
    existingId?: string;
  }): Promise<void> {
    return Promise.resolve();
  }
}
