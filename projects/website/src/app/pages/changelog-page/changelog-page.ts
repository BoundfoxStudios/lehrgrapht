import { Component, inject } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { ContentContainer } from '../../components/content-container/content-container';
import { Meta, Title } from '@angular/platform-browser';
import { changelogData } from '@lehrgrapht/shared';

@Component({
  selector: 'lgw-changelog-page',
  imports: [Hero, ContentContainer],
  templateUrl: './changelog-page.html',
  styleUrl: './changelog-page.css',
})
export class ChangelogPage {
  protected readonly changelogData = changelogData;

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const title = 'LehrGrapht - Versionshistorie';
    const description =
      'Die Versionshistorie von LehrGrapht - alle Änderungen und Neuerungen im Überblick.';

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
      content: 'https://lehrgrapht.de/changelog',
    });
  }
}
