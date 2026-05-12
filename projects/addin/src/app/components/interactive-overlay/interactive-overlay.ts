import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { MarkerNamingService } from '../../services/marker-naming.service';
import { ButtonDirective } from '../../ui/button/button.directive';
import { InteractiveMode } from '../plot-editor/interactive-mode';
import {
  INTERACTIVE_STRATEGIES,
  PlotEditorStore,
} from '../plot-editor/plot-editor.store';
import { PlotPreview } from '../plot-preview/plot-preview';

@Component({
  selector: 'lg-interactive-overlay',
  imports: [FaIconComponent, ButtonDirective, PlotPreview],
  templateUrl: './interactive-overlay.html',
  styleUrl: './interactive-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-0 z-50 flex flex-col',
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': 'title()',
    '(document:keydown.escape)': 'store.cancelInteractive()',
  },
})
export class InteractiveOverlay {
  protected readonly faXmark = faXmark;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faChevronUp = faChevronUp;
  protected readonly faChevronDown = faChevronDown;

  protected readonly store = inject(PlotEditorStore);
  private readonly markerNamingService = inject(MarkerNamingService);

  protected readonly sheetOpen = signal(true);

  protected readonly title = computed(() => {
    switch (this.store.interactiveMode()) {
      case InteractiveMode.Marker:
        return 'Punkte setzen';
      case InteractiveMode.Function:
        return 'Funktion zeichnen';
      case InteractiveMode.Polygon:
        return 'Polygon zeichnen';
      default:
        return '';
    }
  });

  protected readonly ctaLabel = 'Fertig';

  protected readonly minPoints = computed(() => {
    const mode = this.store.interactiveMode();
    if (mode === InteractiveMode.Off) return 0;
    return INTERACTIVE_STRATEGIES[mode].minPoints;
  });

  protected readonly headerMax = computed(() => {
    const mode = this.store.interactiveMode();
    if (mode === InteractiveMode.Off) return 0;
    const strategy = INTERACTIVE_STRATEGIES[mode];
    return strategy.autoFinishAt ?? strategy.minPoints;
  });

  protected readonly canFinish = computed(
    () => this.store.interactivePoints().length >= this.minPoints(),
  );

  protected readonly hasAutoFinish = computed(() => {
    const mode = this.store.interactiveMode();
    if (mode === InteractiveMode.Off) return false;
    return INTERACTIVE_STRATEGIES[mode].autoFinishAt !== undefined;
  });

  protected readonly emptyStateHint = computed(() => {
    switch (this.store.interactiveMode()) {
      case InteractiveMode.Marker:
        return 'Tippe auf den Plot, um einen Punkt zu setzen';
      case InteractiveMode.Function:
        return 'Tippe 2 Punkte für eine Gerade oder 3 für eine Parabel';
      case InteractiveMode.Polygon:
        return 'Tippe mindestens 2 Punkte für ein Polygon';
      default:
        return '';
    }
  });

  protected readonly canCloseByClickingStart = computed(
    () =>
      this.store.interactiveMode() === InteractiveMode.Polygon &&
      this.store.interactivePoints().length >= 3,
  );

  protected pointLabel(index: number): string {
    const mode = this.store.interactiveMode();
    switch (mode) {
      case InteractiveMode.Marker:
        return this.markerNamingService.generateName(
          this.store.model().markers.length + index,
          this.store.plotSettings().markerNamingScheme,
        );
      case InteractiveMode.Function:
        return `P${index + 1}`;
      case InteractiveMode.Polygon:
        return `P${index + 1}`;
      default:
        return `${index + 1}`;
    }
  }

  protected toggleSheet(): void {
    this.sheetOpen.update(v => !v);
  }
}
