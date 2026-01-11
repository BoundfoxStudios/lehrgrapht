import { Component, inject } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { ContentContainer } from '../../components/content-container/content-container';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBoltLightning,
  faCoffee,
  faGear,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faMicrosoft } from '@fortawesome/free-brands-svg-icons';
import { KnownIssues } from '../../components/known-issues/known-issues';
import { Meta, Title } from '@angular/platform-browser';
import { GitHubLink, SupportEmailLink } from '@lehrgrapht/shared';

@Component({
  selector: 'lgw-home-page',
  imports: [
    Hero,
    ContentContainer,
    FaIconComponent,
    KnownIssues,
    GitHubLink,
    SupportEmailLink,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  protected readonly faCoffee = faCoffee;
  protected readonly faGithub = faGithub;
  protected readonly faGear = faGear;
  protected readonly faBoltLightning = faBoltLightning;
  protected readonly faStar = faStar;
  protected readonly faMicrosoft = faMicrosoft;

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const title = 'LehrGrapht - Mathe-Plotter-Word-AddIn für Lehrkräfte';
    const description =
      'Ein kostenfreies Word AddIn zum Erstellen von maßstabsgetreuen Plots für Lehrkräfte.';

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
      content: 'https://lehrgrapht.de',
    });
  }
}
