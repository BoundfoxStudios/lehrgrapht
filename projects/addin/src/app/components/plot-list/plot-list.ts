import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { Header } from '../header/header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBug,
  faCopy,
  faGear,
  faInfoCircle,
  faPen,
  faPlus,
  faRotate,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { WordPlot, WordService } from '../../services/word/word.service';
import { PlotMiniPreview } from '../plot-mini-preview/plot-mini-preview';
import { ButtonDirective } from '../../ui/button/button.directive';
import {
  ConfirmDeleteData,
  ConfirmDeleteDialog,
  ConfirmDeleteResult,
} from './confirm-delete-dialog/confirm-delete-dialog';

@Component({
  selector: 'lg-plot-list',
  imports: [
    RouterLink,
    Header,
    FaIconComponent,
    PlotMiniPreview,
    ButtonDirective,
  ],
  templateUrl: './plot-list.html',
  styleUrl: './plot-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotList {
  protected readonly faTrashCan = faTrashCan;
  protected readonly faPen = faPen;
  protected readonly faInfoCircle = faInfoCircle;
  protected readonly faBug = faBug;
  protected readonly faCopy = faCopy;
  protected readonly faGear = faGear;
  protected readonly faPlus = faPlus;
  protected readonly faRotate = faRotate;

  protected readonly wordService = inject(WordService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  protected plots = resource<WordPlot[], undefined>({
    loader: () => this.wordService.list(),
    defaultValue: [],
  });

  protected readonly headerSubtitle = computed(() => {
    if (this.plots.isLoading()) {
      return 'Plots aus Dokument lesen…';
    }

    const total = this.plots.value().length;

    if (total === 0) {
      return 'Noch keine Plots im Dokument';
    }
    return total === 1 ? '1 Plot im Dokument' : `${total} Plots im Dokument`;
  });

  protected plotMeta(plot: WordPlot): string | null {
    const model = plot.model;
    if (!model) {
      return null;
    }

    const parts: string[] = [];

    if (model.fnx.length === 1) {
      parts.push(`f(x)=${model.fnx[0].fnx}`);
    } else if (model.fnx.length > 1) {
      parts.push(`${model.fnx.length} Funktionen`);
    }

    parts.push(...countPart(model.markers.length, 'Punkt', 'Punkte'));
    parts.push(...countPart(model.lines.length, 'Linie', 'Linien'));
    parts.push(...countPart(model.areas.length, 'Fläche', 'Flächen'));

    return parts.length > 0 ? parts.join(', ') : null;
  }

  protected async deletePlot(plot: WordPlot): Promise<void> {
    const ref = this.dialog.open<
      ConfirmDeleteResult,
      ConfirmDeleteData,
      ConfirmDeleteDialog
    >(ConfirmDeleteDialog, {
      data: { plotName: plot.model?.name ?? 'Plot' },
      hasBackdrop: true,
      role: 'alertdialog',
      ariaLabelledBy: 'confirm-delete-title',
    });

    const result = await firstValueFrom(ref.closed);
    if (result !== 'confirm') {
      return;
    }

    await this.wordService.delete(plot.id);
    this.plots.reload();
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

  protected refresh(): void {
    this.plots.reload();
  }
}

function countPart(
  count: number,
  singular: string,
  plural: string,
): readonly string[] {
  if (count === 0) {
    return [];
  }
  if (count === 1) {
    return [singular];
  }
  return [`${count} ${plural}`];
}
