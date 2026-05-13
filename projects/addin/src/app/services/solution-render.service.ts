import { Injectable, effect, inject } from '@angular/core';
import { PlotService } from './plot/plot.service';
import { plotHasErrorCode } from './plot/plot.types';
import { PlotSettingsService } from './plot-settings.service';
import { SolutionViewService } from './solution-view.service';
import { WordService } from './word/word.service';

@Injectable({ providedIn: 'root' })
export class SolutionRenderService {
  private readonly wordService = inject(WordService);
  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);
  private readonly solutionViewService = inject(SolutionViewService);

  private firstRun = true;

  constructor() {
    effect(() => {
      const showSolution = this.solutionViewService.showSolution();
      if (this.firstRun) {
        this.firstRun = false;
        return;
      }
      void this.regenerateReflectedPlots(showSolution);
    });
  }

  private async regenerateReflectedPlots(showSolution: boolean): Promise<void> {
    const plots = await this.wordService.list();
    const settings = this.plotSettingsService.get();

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
