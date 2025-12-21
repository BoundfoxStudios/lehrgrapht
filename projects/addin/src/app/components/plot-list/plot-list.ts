import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBug,
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

  readonly wordService = inject(WordService);

  protected plots = resource<WordPlot[], undefined>({
    loader: () => this.wordService.list(),
    defaultValue: [],
  });

  protected async deletePlot(id: string): Promise<void> {
    await this.wordService.delete(id);
    this.plots.reload();
  }

  protected select(id: string): Promise<void> {
    return this.wordService.select(id);
  }
}
