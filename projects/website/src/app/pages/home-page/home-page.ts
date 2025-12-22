import { Component } from '@angular/core';
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

@Component({
  selector: 'app-home-page',
  imports: [Hero, ContentContainer, FaIconComponent],
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
}
