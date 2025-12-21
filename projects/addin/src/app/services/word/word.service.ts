import { signal } from '@angular/core';
import { Plot } from '../../models/plot';

export interface WordPlot {
  id: string;
  model?: Plot;
}

export interface PlotGenerationSettings {
  applyScaleFactor: boolean;
}

export const modelIdPrefix = 'plot-';

export abstract class WordService {
  abstract readonly plotGenerationSettings: PlotGenerationSettings;

  readonly selection = signal<WordPlot | undefined>(undefined, {
    equal: (a, b) => a?.id === b?.id,
  });

  /**
   * Returns a list of all plots currently in the document.
   * Each plot must have a model assigned to it
   * (aka saved in the {@link DocumentStorageService}).
   */
  abstract list(): Promise<WordPlot[]>;

  /**
   * Returns a list of all plots currently in the document.
   * Either returns a {@link WordPlot} or the id.
   */
  abstract listRaw(): Promise<(WordPlot | { id: string })[]>;

  /**
   * Deletes a plot from the document.
   * @param id
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Selects a plot in the document.
   * Word might scroll to it, but it's not guaranteed.
   * @param id
   */
  abstract select(id: string): Promise<void>;

  /**
   * Gets a plot from the document.
   * @param id
   */
  abstract get(id: string): Promise<Required<WordPlot> | undefined>;

  /**
   * Inserts or updates a plot in the document.
   * @param options
   */
  abstract upsertPicture(options: {
    base64Picture: string;
    height: number;
    width: number;
    id: string;
    model: Plot;
    existingId?: string;
  }): Promise<void>;
}
