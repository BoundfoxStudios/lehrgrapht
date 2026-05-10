import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import {
  faDrawPolygon,
  faExpand,
  faLocationDot,
  faMinus,
  faSliders,
  faSquareRootVariable,
} from '@fortawesome/free-solid-svg-icons';
import { FormRoot } from '@angular/forms/signals';
import { Dialog } from '@angular/cdk/dialog';
import { Header } from '../header/header';
import { PreviewDock } from '../preview-dock/preview-dock';
import { TabStrip, TabStripItem } from '../tab-strip/tab-strip';
import { PlotEditorStore } from './plot-editor.store';
import {
  UnsavedChangesData,
  UnsavedChangesDialog,
  UnsavedChangesResult,
} from './unsaved-changes-dialog/unsaved-changes-dialog';

@Component({
  selector: 'lg-plot-editor',
  imports: [FormRoot, Header, PreviewDock, TabStrip, RouterOutlet],
  templateUrl: './plot-editor.html',
  styleUrl: './plot-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PlotEditorStore],
})
export class PlotEditor {
  protected readonly store = inject(PlotEditorStore);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);

  protected readonly currentSection = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.activatedRoute.snapshot.firstChild?.url[0]?.path ?? null),
    ),
    { initialValue: null as string | null },
  );

  protected readonly backLink = computed<unknown[]>(() =>
    this.currentSection() === null
      ? ['/plot/list']
      : ['/plot/editor', this.store.routeId()],
  );

  protected readonly showErrorDock = computed(
    () => this.currentSection() === null && this.store.hasErrors(),
  );

  protected readonly sectionTabs = computed<TabStripItem[]>(() => {
    const model = this.store.model();
    return [
      {
        id: 'fnx',
        label: 'Funktionen',
        icon: faSquareRootVariable,
        count: model.fnx.length,
      },
      {
        id: 'markers',
        label: 'Punkte',
        icon: faLocationDot,
        count: model.markers.length,
      },
      {
        id: 'lines',
        label: 'Linien',
        icon: faMinus,
        count: model.lines.length,
      },
      {
        id: 'areas',
        label: 'Flächen',
        icon: faDrawPolygon,
        count: model.areas.length,
      },
      { id: 'range', label: 'Grenzen', icon: faExpand },
      { id: 'settings', label: 'Darstellung', icon: faSliders },
    ];
  });

  protected goToSection(section: string): void {
    this.store.cancelInteractive();
    void this.router.navigate([section], { relativeTo: this.activatedRoute });
  }

  async canDeactivate(): Promise<boolean> {
    if (!this.store.isDirty()) {
      return true;
    }
    this.store.cancelInteractive();

    const ref = this.dialog.open<UnsavedChangesResult, UnsavedChangesData>(
      UnsavedChangesDialog,
      {
        data: {
          hasErrors: this.store.hasErrors,
          errorCount: this.store.errorCount,
          save: () => this.store.saveToDocument(),
        },
        hasBackdrop: true,
        disableClose: false,
        role: 'alertdialog',
        ariaLabelledBy: 'unsaved-changes-title',
      },
    );

    const result = await firstValueFrom(ref.closed);
    return result === 'discard' || result === 'save';
  }
}
