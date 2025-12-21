import { Component } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'lg-info',
  imports: [Header, ContentContainer, FaIconComponent],
  templateUrl: './info.html',
  styleUrl: './info.css',
})
export class Info {
  protected readonly faGithub = faGithub;
}
