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
      case InteractiveMode.Line:
        return 'Linie zeichnen';
      case InteractiveMode.StraightLine:
        return 'Gerade durch zwei Punkte';
      case InteractiveMode.Area:
        return 'Polygon zeichnen';
      default:
        return '';
    }
  });

  protected readonly ctaLabel = computed(() =>
    this.store.interactiveMode() === InteractiveMode.Area
      ? 'Polygon schließen'
      : 'Fertig',
  );

  protected readonly minPoints = computed(() => {
    const mode = this.store.interactiveMode();
    if (mode === InteractiveMode.Off) return 0;
    return INTERACTIVE_STRATEGIES[mode].minPoints;
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
      case InteractiveMode.Line:
      case InteractiveMode.StraightLine:
        return 'Tippe zwei Punkte für die Linie';
      case InteractiveMode.Area:
        return 'Tippe mindestens 3 Eckpunkte, dann „Polygon schließen"';
      default:
        return '';
    }
  });

  protected pointLabel(index: number): string {
    const mode = this.store.interactiveMode();
    switch (mode) {
      case InteractiveMode.Marker:
        return this.markerNamingService.generateName(
          this.store.model().markers.length + index,
          this.store.plotSettings().markerNamingScheme,
        );
      case InteractiveMode.Line:
      case InteractiveMode.StraightLine:
        return index === 0 ? 'Start' : 'Ende';
      case InteractiveMode.Area:
        return `P${index + 1}`;
      default:
        return `${index + 1}`;
    }
  }

  protected toggleSheet(): void {
    this.sheetOpen.update(v => !v);
  }
}
