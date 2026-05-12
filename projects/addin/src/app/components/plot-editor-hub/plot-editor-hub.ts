import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChevronRight,
  faDrawPolygon,
  faExpand,
  faLocationDot,
  faSliders,
  faSquareRootVariable,
} from '@fortawesome/free-solid-svg-icons';
import { FormField } from '@angular/forms/signals';
import { PlotEditorStore } from '../plot-editor/plot-editor.store';

@Component({
  selector: 'lg-plot-editor-hub',
  imports: [FaIconComponent, FormField, RouterLink],
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
  protected readonly faDrawPolygon = faDrawPolygon;

  protected readonly store = inject(PlotEditorStore);

  protected readonly rangeSubtitle = computed(() => {
    const r = this.store.model().range;
    const xCount = (r.x.max - r.x.min) * 2;
    const yCount = (r.y.max - r.y.min) * 2;
    return `x: ${r.x.min} / ${r.x.max} · y: ${r.y.min} / ${r.y.max} · ${xCount}×${yCount} K.`;
  });
}
