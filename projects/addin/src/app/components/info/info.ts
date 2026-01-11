import { Component } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { lehrgraphtVersion } from '../../../version';
import { GitHubLink, SupportEmailLink } from '@lehrgrapht/shared';

@Component({
  selector: 'lg-info',
  imports: [Header, ContentContainer, GitHubLink, SupportEmailLink],
  templateUrl: './info.html',
  styleUrl: './info.css',
})
export class Info {
  protected readonly lehrgraphtVersion = lehrgraphtVersion;
}
