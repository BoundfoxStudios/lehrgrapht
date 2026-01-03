import { Component, inject } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { ContentContainer } from '../../components/content-container/content-container';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'lgw-privacy-policy-page',
  imports: [Hero, ContentContainer],
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
