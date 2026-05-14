import { effect, inject, Injectable, signal } from '@angular/core';
import { Plot } from '../models/plot';
import { PlotService } from './plot/plot.service';
import { plotHasErrorCode } from './plot/plot.types';
import { PlotSettingsService } from './plot-settings.service';
import { SolutionViewService } from './solution-view.service';
import { WordPlot, WordPlotService } from './office/plot/word-plot.service';

export interface SolutionRenderProgress {
  current: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class SolutionRenderService {
  private readonly wordService = inject(WordPlotService);
  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);
  private readonly solutionViewService = inject(SolutionViewService);

  readonly progress = signal<SolutionRenderProgress | null>(null);

  constructor() {
    this.regeneratePlotsEffect();
  }

  private regeneratePlotsEffect(): void {
    let firstRun = true;

    effect(() => {
      const showSolution = this.solutionViewService.showSolution();

      // Effects always run one time, and we do not want to regenerate the plots
      // in this case.
      if (firstRun) {
        firstRun = false;
        return;
      }
      void this.regenerateReflectedPlots(showSolution);
    });
  }

  private async regenerateReflectedPlots(showSolution: boolean): Promise<void> {
    const plots = await this.wordService.list();
    const settings = this.plotSettingsService.get();

    const eligiblePlots = plots.filter(
      (wp): wp is WordPlot & { model: Plot } =>
        !!wp.model &&
        ((wp.model.reflection.kind !== 'none' &&
          wp.model.reflection.isSolution) ||
          wp.model.polygons.some(polygon => polygon.isSolution)),
    );

    if (eligiblePlots.length === 0) {
      return;
    }

    this.progress.set({ current: 0, total: eligiblePlots.length });

    try {
      for (const wp of eligiblePlots) {
        const result = await this.plotService.generate(wp.model, settings, {
          applyScaleFactor:
            this.wordService.plotGenerationSettings.applyScaleFactor,
          showSolution,
        });

        if (!plotHasErrorCode(result)) {
          await this.wordService.upsertPicture({
            id: wp.id,
            existingId: wp.id,
            model: wp.model,
            base64Picture: result.base64,
            width: result.widthInPoints,
            height: result.heightInPoints,
          });
        }

        this.progress.update(p => (p ? { ...p, current: p.current + 1 } : p));
      }
    } finally {
      this.progress.set(null);
    }
  }
}
