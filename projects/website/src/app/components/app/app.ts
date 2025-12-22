import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ContentContainer } from '../content-container/content-container';
import { FloatingScrollToTopComponent } from '../floating-scroll-to-top/floating-scroll-to-top.component';

@Component({
  selector: 'lgw-root',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ContentContainer,
    FloatingScrollToTopComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
