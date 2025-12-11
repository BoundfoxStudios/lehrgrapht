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
import { FirstRunExperienceService } from '../../services/first-run-experience.service';

@Component({
  selector: 'app-first-run-experience',
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
  private readonly firstRunExperienceService = inject(
    FirstRunExperienceService,
  );

  protected proceed(): void {
    this.firstRunExperienceService.hadFirstRunExperience();

    void this.router.navigate(['/plot/list']);
  }
}
