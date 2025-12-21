import { Component, inject } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChartLine,
  faImages,
  faMapPin,
  faTableCells,
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { UserExperienceService } from '../../services/user-experience.service';

@Component({
  selector: 'lg-first-run-experience',
  imports: [Header, ContentContainer, FaIconComponent],
  templateUrl: './first-run-experience.html',
  styleUrl: './first-run-experience.css',
})
export class FirstRunExperience {
  protected readonly faTableCells = faTableCells;
  protected readonly faImages = faImages;
  protected readonly faChartLine = faChartLine;
  protected readonly faMapPin = faMapPin;

  private readonly router = inject(Router);
  private readonly firstRunExperienceService = inject(UserExperienceService);

  protected proceed(): void {
    this.firstRunExperienceService.hadFirstRunExperience();

    void this.router.navigate(['/plot/list']);
  }
}
