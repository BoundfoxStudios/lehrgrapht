import { Component } from '@angular/core';
import { QuadrillePaper } from '../quadrille-paper/quadrille-paper';
import { ContentContainer } from '../content-container/content-container';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Logo } from '../logo/logo';

@Component({
  selector: 'lgw-header',
  imports: [
    QuadrillePaper,
    ContentContainer,
    RouterLinkActive,
    RouterLink,
    Logo,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
