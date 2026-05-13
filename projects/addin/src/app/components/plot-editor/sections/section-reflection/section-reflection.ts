import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowsLeftRightToLine,
  faCircleDot,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Card } from '../../../../ui/card/card';
import { IdPill } from '../../../id-pill/id-pill';
import { Switch } from '../../../switch/switch';

@Component({
  selector: 'lg-section-reflection',
  imports: [FaIconComponent, ButtonDirective, Card, IdPill, Switch],
  templateUrl: './section-reflection.html',
  styleUrl: './section-reflection.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionReflection {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly faCircleDot = faCircleDot;
  protected readonly faArrowsLeftRightToLine = faArrowsLeftRightToLine;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly store = inject(PlotEditorStore);

  protected readonly reflection = computed(() => this.store.model().reflection);
  protected readonly kind = computed(() => this.reflection().kind);

  protected readonly axisIsDegenerate = computed(() => {
    const r = this.reflection();
    if (r.kind !== 'axis') {
      return false;
    }
    return r.axis.p1.x === r.axis.p2.x && r.axis.p1.y === r.axis.p2.y;
  });

  protected onPointXChange(event: Event): void {
    const value = this.parseEventValue(event);
    if (value === null) {
      return;
    }
    const r = this.reflection();
    if (r.kind !== 'point') {
      return;
    }
    this.store.setReflectionPoint({ x: value, y: r.point.y });
  }

  protected onPointYChange(event: Event): void {
    const value = this.parseEventValue(event);
    if (value === null) {
      return;
    }
    const r = this.reflection();
    if (r.kind !== 'point') {
      return;
    }
    this.store.setReflectionPoint({ x: r.point.x, y: value });
  }

  protected onAxisX1Change(event: Event): void {
    const value = this.parseEventValue(event);
    if (value === null) {
      return;
    }
    const r = this.reflection();
    if (r.kind !== 'axis') {
      return;
    }
    this.store.setReflectionAxis({ x: value, y: r.axis.p1.y }, r.axis.p2);
  }

  protected onAxisY1Change(event: Event): void {
    const value = this.parseEventValue(event);
    if (value === null) {
      return;
    }
    const r = this.reflection();
    if (r.kind !== 'axis') {
      return;
    }
    this.store.setReflectionAxis({ x: r.axis.p1.x, y: value }, r.axis.p2);
  }

  protected onAxisX2Change(event: Event): void {
    const value = this.parseEventValue(event);
    if (value === null) {
      return;
    }
    const r = this.reflection();
    if (r.kind !== 'axis') {
      return;
    }
    this.store.setReflectionAxis(r.axis.p1, { x: value, y: r.axis.p2.y });
  }

  protected onAxisY2Change(event: Event): void {
    const value = this.parseEventValue(event);
    if (value === null) {
      return;
    }
    const r = this.reflection();
    if (r.kind !== 'axis') {
      return;
    }
    this.store.setReflectionAxis(r.axis.p1, { x: r.axis.p2.x, y: value });
  }

  protected remove(): void {
    this.store.removeReflection();
  }

  protected toggleIsSolution(): void {
    this.store.toggleReflectionIsSolution();
  }

  private parseEventValue(event: Event): number | null {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return null;
    }
    const value = parseFloat(target.value);
    return Number.isFinite(value) ? value : null;
  }
}
