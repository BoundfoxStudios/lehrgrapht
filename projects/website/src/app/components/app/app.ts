import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ContentContainer } from '../content-container/content-container';
import { FloatingScrollToTopComponent } from '../floating-scroll-to-top/floating-scroll-to-top.component';
import { GitHubLink, SupportEmailLink } from '@lehrgrapht/shared';
import { Logo } from '../logo/logo';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCoffee, faHeart } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lgw-root',
  imports: [
    RouterOutlet,
    ContentContainer,
    FloatingScrollToTopComponent,
    SupportEmailLink,
    Logo,
    FaIconComponent,
    GitHubLink,
    RouterLink,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly faHeart = faHeart;
  protected readonly faCoffee = faCoffee;
}
