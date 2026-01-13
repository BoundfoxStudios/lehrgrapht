import { Component, input, model, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lg-accordion-panel',
  imports: [FaIconComponent],
  templateUrl: './accordion-panel.html',
  styleUrl: './accordion-panel.css',
  host: {
    '[class.is-collapsed]': '!isExpanded()',
  },
})
export class AccordionPanel implements OnInit {
  protected readonly faChevronDown = faChevronDown;

  readonly title = input.required<string>();
  readonly subTitle = input<string>();
  readonly isExpanded = model(false);
  readonly persistenceId = input<string>();

  protected toggle(): void {
    this.isExpanded.update(isExpanded => !isExpanded);
    this.persist();
  }

  private persist(): void {
    const isExpanded = this.isExpanded();
    const persistenceId = this.persistenceId();

    if (!persistenceId) {
      return;
    }

    localStorage.setItem(`panel-${persistenceId}`, JSON.stringify(isExpanded));
  }

  private restorePersistence(): void {
    const persistenceId = this.persistenceId();

    if (!persistenceId) {
      return;
    }

    const savedIsExpanded = localStorage.getItem(`panel-${persistenceId}`);
    const isExpanded = savedIsExpanded
      ? (JSON.parse(savedIsExpanded) as boolean)
      : this.isExpanded();
    this.isExpanded.set(isExpanded);
  }

  ngOnInit(): void {
    this.restorePersistence();
  }
}
