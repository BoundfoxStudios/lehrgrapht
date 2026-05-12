import { Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBoltLightning,
  faCoffee,
  faFaceSmile,
  faGear,
  faLightbulb,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { KnownIssues } from '../../components/known-issues/known-issues';
import { Meta, Title } from '@angular/platform-browser';
import { GitHubLink, gitHubUrl, SupportEmailLink } from '@lehrgrapht/shared';
import { Header } from '../../components/header/header';
import { Handwritten } from '../../components/handwritten/handwritten';
import {
  Section,
  SectionContent,
  SectionHandwritten,
  SectionHeadline,
  SectionSideContent,
} from '../../components/section/section';
import { QuadrillePaper } from '../../components/quadrille-paper/quadrille-paper';
import { lehrgraphtVersion } from '../../../../../addin/src/version';

@Component({
  selector: 'lgw-home-page',
  imports: [
    FaIconComponent,
    KnownIssues,
    GitHubLink,
    SupportEmailLink,
    Header,
    Handwritten,
    Section,
    SectionHandwritten,
    SectionHeadline,
    SectionContent,
    QuadrillePaper,
    SectionSideContent,
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
  protected readonly faArrowRight = faArrowRight;
  protected readonly gitHubUrl = gitHubUrl;

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

  protected readonly faLightbulb = faLightbulb;
  protected readonly lehrgraphtVersion = lehrgraphtVersion;
  protected readonly faFaceSmile = faFaceSmile;
}
