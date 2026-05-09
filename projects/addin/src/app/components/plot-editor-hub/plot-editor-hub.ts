import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChevronRight,
  faDrawPolygon,
  faExpand,
  faLocationDot,
  faMinus,
  faSliders,
  faSquareRootVariable,
} from '@fortawesome/free-solid-svg-icons';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Plot } from '../../models/plot';

export type HubSection =
  | 'fnx'
  | 'markers'
  | 'lines'
  | 'areas'
  | 'range'
  | 'settings';

@Component({
  selector: 'lg-plot-editor-hub',
  imports: [FaIconComponent, FormField],
  templateUrl: './plot-editor-hub.html',
  styleUrl: './plot-editor-hub.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotEditorHub {
  protected readonly faExpand = faExpand;
  protected readonly faSliders = faSliders;
  protected readonly faChevronRight = faChevronRight;
  protected readonly faSquareRootVariable = faSquareRootVariable;
  protected readonly faLocationDot = faLocationDot;
  protected readonly faMinus = faMinus;
  protected readonly faDrawPolygon = faDrawPolygon;

  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly sectionSelect = output<HubSection>();

  protected readonly model = computed(() => this.editorForm()().value());

  protected readonly squareCount = computed(() => {
    const range = this.model().range;
    const x = (range.x.max - range.x.min) * 2;
    const y = (range.y.max - range.y.min) * 2;
    return `${x} × ${y}`;
  });

  protected readonly rangeSummary = computed(() => {
    const range = this.model().range;
    return `x: ${range.x.min} / ${range.x.max} · y: ${range.y.min} / ${range.y.max} · ${this.squareCount()} K.`;
  });

  protected readonly fnxCount = computed(() => this.model().fnx.length);
  protected readonly markersCount = computed(() => this.model().markers.length);
  protected readonly linesCount = computed(() => this.model().lines.length);
  protected readonly areasCount = computed(() => this.model().areas.length);

  protected select(section: HubSection): void {
    this.sectionSelect.emit(section);
  }
}
