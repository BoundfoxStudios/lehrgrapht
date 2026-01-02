import { Component, inject, resource } from '@angular/core';
import { GitHubService } from '../../services/github.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBug,
  faComment,
  faExternalLink,
  faHeart,
  faMagicWandSparkles,
  faThumbsUp,
} from '@fortawesome/free-solid-svg-icons';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'lgw-known-issues',
  imports: [FaIconComponent, TruncatePipe, DatePipe],
  templateUrl: './known-issues.html',
  styleUrl: './known-issues.css',
})
export class KnownIssues {
  private readonly githubService = inject(GitHubService);

  protected readonly issues = resource({
    loader: () => this.githubService.getCachedIssues(),
  });
  protected readonly faGithub = faGithub;
  protected readonly faExternalLink = faExternalLink;
  protected readonly faComment = faComment;
  protected readonly faThumbsUp = faThumbsUp;
  protected readonly faHeart = faHeart;
  protected readonly faBug = faBug;
  protected readonly faMagicWandSparkles = faMagicWandSparkles;
}
