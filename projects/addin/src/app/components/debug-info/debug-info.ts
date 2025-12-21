import { Component, inject, resource } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { Section } from '../section/section';
import {
  modelIdPrefix,
  WordPlot,
  WordService,
} from '../../services/word/word.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faRefresh, faWarning } from '@fortawesome/free-solid-svg-icons';
import { JsonPipe } from '@angular/common';
import { DocumentStorageService } from '../../services/document-storage.service';

@Component({
  selector: 'app-debug-info',
  imports: [Header, ContentContainer, Section, FaIconComponent, JsonPipe],
  templateUrl: './debug-info.html',
  styleUrl: './debug-info.css',
})
export class DebugInfo {
  protected readonly faRefresh = faRefresh;
  protected readonly faWarning = faWarning;

  private readonly wordService = inject(WordService);
  private readonly documentStorageService = inject(DocumentStorageService);

  protected readonly plots = resource({
    loader: () => this.wordService.listRaw(),
  });

  protected readonly models = resource({
    loader: () => this.documentStorageService.list(modelIdPrefix),
  });

  protected isPlot(input: WordPlot | { id: string }): input is WordPlot {
    return !!(input as WordPlot).id;
  }

  protected modelHasPlot(
    plots: (WordPlot | { id: string })[],
    id: string,
  ): boolean {
    return !!plots.find(item => this.isPlot(item) && id.endsWith(item.id));
  }
}
