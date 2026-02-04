import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
  model,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { NgTemplateOutlet } from '@angular/common';

export interface DropdownOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'lg-dropdown',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, FaIconComponent, NgTemplateOutlet],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class Dropdown<T> implements FormValueControl<T> {
  protected readonly faChevronDown = faChevronDown;

  readonly options = input.required<DropdownOption<T>[]>();
  readonly value = model<T>(undefined as unknown as T);
  readonly disabled = input(false);
  readonly placeholder = input('Auswählen...');

  readonly itemTemplate = contentChild<TemplateRef<{ $implicit: DropdownOption<T> }>>(
    'itemTemplate'
  );

  protected readonly isOpen = signal(false);
  protected readonly focusedIndex = signal(-1);

  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('triggerButton');
  private readonly optionsList = viewChild<ElementRef<HTMLUListElement>>('optionsList');

  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    },
  ];

  protected readonly selectedOption = computed(() => {
    const currentValue = this.value();
    return this.options().find(opt => opt.value === currentValue);
  });

  protected readonly displayLabel = computed(() => {
    return this.selectedOption()?.label ?? this.placeholder();
  });

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      const currentIndex = this.options().findIndex(
        opt => opt.value === this.value()
      );
      this.focusedIndex.set(currentIndex >= 0 ? currentIndex : 0);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    this.triggerRef()?.nativeElement.focus();
  }

  protected selectOption(option: DropdownOption<T>): void {
    this.value.set(option.value);
    this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      return;
    }

    const options = this.options();
    const currentIndex = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(
          currentIndex < options.length - 1 ? currentIndex + 1 : 0
        );
        this.scrollToFocused();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(
          currentIndex > 0 ? currentIndex - 1 : options.length - 1
        );
        this.scrollToFocused();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < options.length) {
          this.selectOption(options[currentIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected onOptionMouseEnter(index: number): void {
    this.focusedIndex.set(index);
  }

  private scrollToFocused(): void {
    const list = this.optionsList()?.nativeElement;
    const focused = list?.querySelector('[data-focused="true"]');
    focused?.scrollIntoView({ block: 'nearest' });
  }
}
