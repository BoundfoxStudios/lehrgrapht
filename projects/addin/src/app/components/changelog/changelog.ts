import { Component, computed, inject, signal } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { lehrgraphtVersion } from '../../../version';
import { ActivatedRoute, Router } from '@angular/router';
import { UserExperienceService } from '../../services/user-experience.service';
import { AccordionContent, AccordionGroup, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lg-changelog',
  imports: [
    Header,
    ContentContainer,
    AccordionGroup,
    AccordionTrigger,
    AccordionPanel,
    AccordionContent,
    FaIconComponent,
  ],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css',
})
export class Changelog {
  protected readonly lehrgraphtVersion = lehrgraphtVersion;
  protected readonly faMinus = faMinus;
  protected readonly faPlus = faPlus;

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly userExperienceService = inject(UserExperienceService);

  private readonly queryParams = toSignal(this.activatedRoute.queryParamMap);
  protected readonly showUpdateNotice = computed(() => !!this.queryParams()?.has('showUpdateNotice'));

  protected proceed(): void {
    this.userExperienceService.hasSeenCurrentChangelog(lehrgraphtVersion);

    void this.router.navigate(['/plot/list']);
  }
}
