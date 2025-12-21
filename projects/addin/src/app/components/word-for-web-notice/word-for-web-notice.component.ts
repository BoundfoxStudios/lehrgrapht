import { Component, inject } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { Router } from '@angular/router';
import { UserExperienceService } from '../../services/user-experience.service';

@Component({
  selector: 'app-word-for-web-notice',
  imports: [Header, ContentContainer],
  templateUrl: './word-for-web-notice.component.html',
  styleUrl: './word-for-web-notice.component.css',
})
export class WordForWebNotice {
  private readonly router = inject(Router);
  private readonly firstRunExperienceService = inject(UserExperienceService);

  protected proceed(): void {
    this.firstRunExperienceService.hadWordForWebNotice();

    void this.router.navigate(['/']);
  }
}
