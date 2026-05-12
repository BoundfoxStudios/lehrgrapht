import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCube,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FormField } from '@angular/forms/signals';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { Dropdown } from '../../../dropdown/dropdown';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { labelPositionOptions, lineStyleOptions } from '../../dropdown-options';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Card } from '../../../../ui/card/card';
import { Input } from '../../../../ui/input/input';
import { SectionEmptyState } from '../section-empty-state/section-empty-state';
import { SectionPolygonsImage } from './section-polygons-image';
import { Polygon, PolygonFillStyle } from '../../../../models/plot';
import { PillSwitch, PillSwitchOption } from '../../../pill-switch/pill-switch';
import { SectionHint } from '../../../section-hint/section-hint';
import { IdPill, IdPillPrefix } from '../../../id-pill/id-pill';
import {
  SchraegbildData,
  SchraegbildDialog,
  SchraegbildResult,
  schraegbildDirectionToOffset,
} from './schraegbild-dialog/schraegbild-dialog';

@Component({
  selector: 'lg-section-polygons',
  imports: [
    FaIconComponent,
    FormField,
    Dropdown,
    PillSwitch,
    SectionHint,
    ButtonDirective,
    Card,
    Input,
    SectionEmptyState,
    SectionPolygonsImage,
    IdPill,
  ],
  templateUrl: './section-polygons.html',
  styleUrl: './section-polygons.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPolygons {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly faCube = faCube;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly lineStyleOptions = lineStyleOptions;
  protected readonly labelPositionOptions = labelPositionOptions;
  protected readonly fillStyleOptions: PillSwitchOption<PolygonFillStyle>[] = [
    { value: 'solid', label: 'Voll' },
    { value: 'hatched', label: 'Schraffur' },
    { value: 'outline', label: 'Nur Rand' },
  ];
  protected readonly store = inject(PlotEditorStore);
  private readonly dialog = inject(Dialog);
  protected readonly newItemIndex = signal<number | null>(null);

  protected readonly expandedSet = computed(
    () => new Set(this.store.expandedItems().polygons),
  );

  protected readonly allCollapsed = computed(
    () => this.store.expandedItems().polygons.length === 0,
  );

  protected addManual(): void {
    this.store.addPolygon();
    this.newItemIndex.set(this.store.model().polygons.length - 1);
  }

  protected toggleAll(): void {
    if (this.allCollapsed()) {
      this.store.expandAllCards('polygons');
    } else {
      this.store.collapseAllCards('polygons');
    }
  }

  protected polygonPrefix(polygon: Polygon): IdPillPrefix {
    // closed shape with >= 3 points -> Area, otherwise Line
    return polygon.connect && polygon.points.length >= 3 ? 'F' : 'L';
  }

  protected polygonTitle(polygon: Polygon, index: number): string {
    const n = polygon.points.length;
    if (n === 2) return `Linie ${index + 1}`;
    if (n === 3 && polygon.connect) return `Dreieck ${index + 1}`;
    if (n === 4 && polygon.connect) return `Viereck ${index + 1}`;
    if (n >= 5 && polygon.connect) return `Fläche ${index + 1}`;
    return `Polygon ${index + 1}`;
  }

  protected onFillColorChange(polygonIndex: number, color: string): void {
    this.store.editorForm().controlValue.update(m => ({
      ...m,
      polygons: m.polygons.map((polygon, i) =>
        i === polygonIndex ? { ...polygon, fillColor: color } : polygon,
      ),
    }));
  }

  protected onShowPointsChange(polygonIndex: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!checked) return;
    this.store.autoLabelPolygonPointsIfEmpty(polygonIndex);
  }

  protected canCreateSchraegbild(polygon: Polygon): boolean {
    return polygon.connect && polygon.points.length >= 3;
  }

  protected async openSchraegbildDialog(polygonIndex: number): Promise<void> {
    const polygon = this.store.model().polygons[polygonIndex];
    if (!this.canCreateSchraegbild(polygon)) {
      return;
    }

    const ref = this.dialog.open<
      SchraegbildResult,
      SchraegbildData,
      SchraegbildDialog
    >(SchraegbildDialog, {
      data: { polygonTitle: this.polygonTitle(polygon, polygonIndex) },
      hasBackdrop: true,
      role: 'dialog',
      ariaLabelledBy: 'schraegbild-dialog-title',
    });

    const result = await firstValueFrom(ref.closed);
    if (!result) {
      return;
    }

    const offset = schraegbildDirectionToOffset(result.direction, result.depth);
    this.store.createObliqueProjection({ polygonIndex, offset });
  }
}
