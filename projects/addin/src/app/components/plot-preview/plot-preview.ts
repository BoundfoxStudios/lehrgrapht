import { Component, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { PlotService } from '../../services/plot.service';
import { switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Plot } from '../../models/plot';
import { ContentContainer } from '../content-container/content-container';

@Component({
  selector: 'lg-plot-preview',
  imports: [AsyncPipe, ContentContainer],
  templateUrl: './plot-preview.html',
  styleUrl: './plot-preview.css',
})
export class PlotPreview {
  private readonly plotService = inject(PlotService);

  readonly plot = input.required<Plot>();

  preview$ = toObservable(this.plot).pipe(
    switchMap(plot =>
      this.plotService.generate(plot, {
        applyScaleFactor: true,
      }),
    ),
  );
}
