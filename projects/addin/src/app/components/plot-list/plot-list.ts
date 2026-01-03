import { Component, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBug,
  faCopy,
  faInfoCircle,
  faPen,
  faRefresh,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { ContentContainer } from '../content-container/content-container';
import { WordPlot, WordService } from '../../services/word/word.service';

@Component({
  selector: 'lg-plot-list',
  imports: [RouterLink, Header, FaIconComponent, ContentContainer],
  templateUrl: './plot-list.html',
  styleUrl: './plot-list.css',
})
export class PlotList {
  protected readonly faRefresh = faRefresh;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faPen = faPen;
  protected readonly faInfoCircle = faInfoCircle;
  protected readonly faBug = faBug;

  protected readonly wordService = inject(WordService);
  private readonly router = inject(Router);

  protected plots = resource<WordPlot[], undefined>({
    loader: () => this.wordService.list(),
    defaultValue: [],
  });

  protected async deletePlot(id: string): Promise<void> {
    await this.wordService.delete(id);
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

  protected readonly faCopy = faCopy;
}
