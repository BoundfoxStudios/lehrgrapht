import { Component, inject, resource } from '@angular/core';
import { GitHubService } from '../../services/github.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBug,
  faComment,
  faExternalLink,
  faHeart,
  faMagicWandSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { DatePipe } from '@angular/common';
import { GitHubLink, gitHubUrl, SupportEmailLink } from '@lehrgrapht/shared';
import { Handwritten } from '../handwritten/handwritten';
import { InsertWbrPipe } from '../../pipes/insert-wbr-pipe';

@Component({
  selector: 'lgw-known-issues',
  imports: [
    FaIconComponent,
    TruncatePipe,
    DatePipe,
    GitHubLink,
    SupportEmailLink,
    Handwritten,
    InsertWbrPipe,
  ],
  templateUrl: './known-issues.html',
  styleUrl: './known-issues.css',
})
export class KnownIssues {
  protected readonly faExternalLink = faExternalLink;
  protected readonly faComment = faComment;
  protected readonly faHeart = faHeart;
  protected readonly faBug = faBug;
  protected readonly faMagicWandSparkles = faMagicWandSparkles;
  protected readonly faArrowRight = faArrowRight;

  private readonly githubService = inject(GitHubService);

  protected readonly issues = resource({
    loader: () => this.githubService.getCachedIssues(),
  });
  protected readonly gitHubUrl = gitHubUrl;
}
