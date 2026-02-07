import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { switchMap } from 'rxjs';
import { Plot } from '../../models/plot';
import { PlotService } from '../../services/plot/plot.service';
import { plotHasErrorCode } from '../../services/plot/plot.types';
import { PlotSettingsService } from '../../services/plot-settings.service';

@Component({
  selector: 'lg-plot-mini-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  templateUrl: './plot-mini-preview.html',
})
export class PlotMiniPreview {
  private readonly plotService = inject(PlotService);
  private readonly plotSettingsService = inject(PlotSettingsService);

  readonly plot = input.required<Plot>();

  private readonly model = computed(() => ({
    plot: this.plot(),
    plotSettings: this.plotSettingsService.get(),
  }));

  readonly preview$ = toObservable(this.model).pipe(
    switchMap(({ plot, plotSettings }) =>
      this.plotService.generate(plot, plotSettings, {
        applyScaleFactor: false,
      }),
    ),
  );

  protected readonly isError = plotHasErrorCode;
}
