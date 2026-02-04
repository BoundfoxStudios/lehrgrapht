import { Component, computed, inject } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { lehrgraphtVersion } from '../../../version';
import { ActivatedRoute, Router } from '@angular/router';
import { UserExperienceService } from '../../services/user-experience.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Accordion } from '../accordion/accordion';
import { AccordionPanel } from '../accordion/accordion-panel/accordion-panel';
import { changelogData } from '@lehrgrapht/shared';

@Component({
  selector: 'lg-changelog',
  imports: [Header, ContentContainer, Accordion, AccordionPanel],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css',
})
export class Changelog {
  protected readonly lehrgraphtVersion = lehrgraphtVersion;
  protected readonly changelogData = changelogData;

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly userExperienceService = inject(UserExperienceService);

  private readonly queryParams = toSignal(this.activatedRoute.queryParamMap);
  protected readonly showUpdateNotice = computed(
    () => !!this.queryParams()?.has('showUpdateNotice'),
  );

  protected proceed(): void {
    this.userExperienceService.hasSeenCurrentChangelog(lehrgraphtVersion);

    void this.router.navigate(['/plot/list']);
  }
}
