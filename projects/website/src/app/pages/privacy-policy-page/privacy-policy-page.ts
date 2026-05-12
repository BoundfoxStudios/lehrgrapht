import { Component, inject } from '@angular/core';
import { ContentContainer } from '../../components/content-container/content-container';
import { Meta, Title } from '@angular/platform-browser';
import { Handwritten } from '../../components/handwritten/handwritten';
import { Header } from '../../components/header/header';

@Component({
  selector: 'lgw-privacy-policy-page',
  imports: [ContentContainer, Handwritten, Header],
  templateUrl: './privacy-policy-page.html',
  styleUrl: './privacy-policy-page.css',
})
export class PrivacyPolicyPage {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const title = 'LehrGrapht - Datenschutzerklärung';
    const description =
      'Die Datenschutzerklärung von LehrGrapht - wir sammeln keinerlei Daten!';

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
      content: 'https://lehrgrapht.de/privacy-policy',
    });
  }
}
