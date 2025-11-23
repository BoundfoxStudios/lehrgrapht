import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowCircleLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  imports: [RouterLink, FaIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected readonly faArrowCircleLeft = faArrowCircleLeft;

  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly backLink = input<unknown[]>();
}
