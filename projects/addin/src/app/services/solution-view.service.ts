import { Injectable, inject, signal } from '@angular/core';
import { PlotService } from './plot/plot.service';
import { plotHasErrorCode } from './plot/plot.types';
import { PlotSettingsService } from './plot-settings.service';
import { WordService } from './word/word.service';

@Injectable({ providedIn: 'root' })
export class SolutionViewService {
  private readonly wordService = inject(WordService);
  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);

  readonly showSolution = signal(false);

  async toggle(): Promise<void> {
    this.showSolution.update(v => !v);
    await this.regenerateReflectedPlots();
  }

  private async regenerateReflectedPlots(): Promise<void> {
    const plots = await this.wordService.list();
    const settings = this.plotSettingsService.get();
    const showSolution = this.showSolution();

    for (const wp of plots) {
      if (!wp.model || wp.model.reflection.kind === 'none') continue;

      const result = await this.plotService.generate(wp.model, settings, {
        applyScaleFactor:
          this.wordService.plotGenerationSettings.applyScaleFactor,
        showSolution,
      });
      if (plotHasErrorCode(result)) continue;

      await this.wordService.upsertPicture({
        id: wp.id,
        existingId: wp.id,
        model: wp.model,
        base64Picture: result.base64,
        width: result.widthInPoints,
        height: result.heightInPoints,
      });
    }
  }
}
