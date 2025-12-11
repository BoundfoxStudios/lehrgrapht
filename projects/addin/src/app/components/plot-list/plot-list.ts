import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../header/header';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faInfoCircle,
  faPen,
  faRefresh,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { ContentContainer } from '../content-container/content-container';
import { WordPlot, WordService } from '../../services/word.service';

@Component({
  selector: 'app-plot-list',
  imports: [RouterLink, Header, FaIconComponent, ContentContainer],
  templateUrl: './plot-list.html',
  styleUrl: './plot-list.css',
})
export class PlotList {
  protected readonly faRefresh = faRefresh;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faPen = faPen;
  protected readonly faInfoCircle = faInfoCircle;

  readonly wordService = inject(WordService);

  protected plots = resource<WordPlot[], undefined>({
    loader: () => this.wordService.list(),
    defaultValue: [],
  });

  protected async deletePlot(officeId: number): Promise<void> {
    await this.wordService.delete(officeId);
    this.plots.reload();
  }

  protected select(officeId: number): Promise<void> {
    return this.wordService.select(officeId);
  }
}
