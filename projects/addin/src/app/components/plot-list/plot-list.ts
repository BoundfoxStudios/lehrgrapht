import {
  ChangeDetectionStrategy,
  Component,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBug,
  faCopy,
  faGear,
  faInfoCircle,
  faPen,
  faPlus,
  faRefresh,
  faRotateLeft,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { ContentContainer } from '../content-container/content-container';
import { WordPlot, WordService } from '../../services/word/word.service';
import { PlotMiniPreview } from '../plot-mini-preview/plot-mini-preview';

const UNDO_DELAY_MS = 5000;

interface PendingDelete {
  plot: WordPlot;
  timer: ReturnType<typeof setTimeout>;
}

@Component({
  selector: 'lg-plot-list',
  imports: [
    RouterLink,
    Header,
    FaIconComponent,
    ContentContainer,
    PlotMiniPreview,
  ],
  templateUrl: './plot-list.html',
  styleUrl: './plot-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotList {
  protected readonly faRefresh = faRefresh;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faPen = faPen;
  protected readonly faInfoCircle = faInfoCircle;
  protected readonly faBug = faBug;
  protected readonly faCopy = faCopy;
  protected readonly faGear = faGear;
  protected readonly faPlus = faPlus;
  protected readonly faRotateLeft = faRotateLeft;

  protected readonly wordService = inject(WordService);
  private readonly router = inject(Router);

  protected plots = resource<WordPlot[], undefined>({
    loader: () => this.wordService.list(),
    defaultValue: [],
  });

  protected readonly pendingDelete = signal<PendingDelete | null>(null);

  protected deletePlot(plot: WordPlot): void {
    const pending = this.pendingDelete();
    if (pending) {
      void this.commitPendingDelete(pending);
    }

    const timer = setTimeout(() => {
      void this.commitPendingDelete({ plot, timer });
    }, UNDO_DELAY_MS);

    this.pendingDelete.set({ plot, timer });
  }

  protected undoDelete(): void {
    const pending = this.pendingDelete();
    if (!pending) {
      return;
    }
    clearTimeout(pending.timer);
    this.pendingDelete.set(null);
  }

  protected async clonePlot(id: string): Promise<void> {
    const newId = await this.wordService.clone(id);

    if (newId) {
      await this.router.navigate(['/plot/editor', newId]);
    }
  }

  protected select(id: string): Promise<void> {
    return this.wordService.select(id);
  }

  private async commitPendingDelete(pending: PendingDelete): Promise<void> {
    clearTimeout(pending.timer);
    if (this.pendingDelete()?.plot.id === pending.plot.id) {
      this.pendingDelete.set(null);
    }
    await this.wordService.delete(pending.plot.id);
    this.plots.reload();
  }
}
