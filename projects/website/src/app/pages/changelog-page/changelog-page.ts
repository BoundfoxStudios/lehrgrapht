import { Component, inject } from '@angular/core';
import { ContentContainer } from '../../components/content-container/content-container';
import { Meta, Title } from '@angular/platform-browser';
import { changelogData, gitHubUrl } from '@lehrgrapht/shared';
import { Handwritten } from '../../components/handwritten/handwritten';
import { Header } from '../../components/header/header';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'lgw-changelog-page',
  imports: [ContentContainer, Handwritten, Header, DatePipe],
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

  protected readonly faArrowRight = faArrowRight;
  protected readonly gitHubUrl = gitHubUrl;
  protected readonly faGithub = faGithub;
}
