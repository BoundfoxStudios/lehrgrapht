import { Component, inject } from '@angular/core';
import { ContentContainer } from '../../components/content-container/content-container';
import { Meta, Title } from '@angular/platform-browser';
import { Handwritten } from '../../components/handwritten/handwritten';
import { Header } from '../../components/header/header';

@Component({
  selector: 'lgw-imprint-page',
  imports: [ContentContainer, Handwritten, Header],
  templateUrl: './imprint-page.html',
  styleUrl: './imprint-page.css',
})
export class ImprintPage {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const title = 'LehrGrapht - Impressum';
    const description = 'Das Impressum von LehrGrapht';

    this.title.setTitle(title);
    this.meta.addTag({
      property: 'og:title',
      content: title,
    });
    this.meta.addTag({
      name: 'description',
      content: description,
    });
    this.meta.addTag({
      property: 'og:description',
      content: description,
    });
    this.meta.addTag({
      property: 'og:url',
      content: 'https://lehrgrapht.de/imprint',
    });
  }
}
