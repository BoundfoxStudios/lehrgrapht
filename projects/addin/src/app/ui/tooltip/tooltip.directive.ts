import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  inputBinding,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {
  ConnectedPosition,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipPanel } from './tooltip-panel';

export type TooltipPosition = 'above' | 'below';

let tooltipIdCounter = 0;

const VIEWPORT_MARGIN = 8;
const MAX_PANEL_WIDTH = '18rem';

const ABOVE_POSITION: ConnectedPosition = {
  originX: 'center',
  originY: 'top',
  overlayX: 'center',
  overlayY: 'bottom',
};

const BELOW_POSITION: ConnectedPosition = {
  originX: 'center',
  originY: 'bottom',
  overlayX: 'center',
  overlayY: 'top',
};

@Directive({
  selector: '[lgTooltip]',
  host: {
    '[attr.aria-describedby]': 'isOpen() ? panelId : null',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
    '(click)': 'onActivate()',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class TooltipDirective {
  readonly content = input.required<string | TemplateRef<void>>({
    alias: 'lgTooltip',
  });
  readonly position = input<TooltipPosition>('above', {
    alias: 'lgTooltipPosition',
  });

  protected readonly panelId = `lg-tooltip-${++tooltipIdCounter}`;

  private readonly pointerInside = signal(false);
  private readonly focused = signal(false);
  private readonly pinned = signal(false);
  private readonly dismissed = signal(false);

  protected readonly isOpen = computed(
    () =>
      this.pinned() ||
      (!this.dismissed() && (this.pointerInside() || this.focused())),
  );

  private readonly injector = inject(Injector);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private readonly positionStrategy = createFlexibleConnectedPositionStrategy(
    this.injector,
    this.elementRef,
  )
    .withFlexibleDimensions(false)
    .withViewportMargin(VIEWPORT_MARGIN);

  private readonly positions = computed<ConnectedPosition[]>(() =>
    this.position() === 'below'
      ? [BELOW_POSITION, ABOVE_POSITION]
      : [ABOVE_POSITION, BELOW_POSITION],
  );

  private overlayRef: OverlayRef | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.show();
      } else {
        this.overlayRef?.detach();
      }
    });

    inject(DestroyRef).onDestroy(() => this.overlayRef?.dispose());
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    this.pointerInside.set(true);
  }

  protected onPointerLeave(): void {
    this.pointerInside.set(false);
    this.dismissed.set(false);
  }

  protected onFocus(): void {
    this.focused.set(true);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.pinned.set(false);
    this.dismissed.set(false);
  }

  protected onActivate(): void {
    this.dismissed.set(false);
    this.pinned.update(pinned => !pinned);
  }

  protected onEscape(): void {
    if (!this.isOpen()) {
      return;
    }
    this.pinned.set(false);
    this.dismissed.set(true);
  }

  private show(): void {
    const overlayRef = (this.overlayRef ??= this.createOverlayRef());
    this.positionStrategy.withPositions(this.positions());

    if (overlayRef.hasAttached()) {
      overlayRef.updatePosition();
      return;
    }

    overlayRef.attach(
      new ComponentPortal(TooltipPanel, this.viewContainerRef, null, null, [
        inputBinding('content', this.content),
        inputBinding('panelId', () => this.panelId),
      ]),
    );
  }

  private createOverlayRef(): OverlayRef {
    const overlayRef = createOverlayRef(this.injector, {
      positionStrategy: this.positionStrategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector, {
        autoClose: true,
      }),
      maxWidth: MAX_PANEL_WIDTH,
    });

    overlayRef.overlayElement.addEventListener('pointerenter', () => {
      this.pointerInside.set(true);
    });
    overlayRef.overlayElement.addEventListener('pointerleave', () => {
      this.pointerInside.set(false);
    });

    overlayRef.outsidePointerEvents().subscribe(event => {
      // The trigger's own click is an outside event for the overlay; onActivate owns it.
      if (!this.elementRef.nativeElement.contains(event.target as Node)) {
        this.pinned.set(false);
      }
    });

    return overlayRef;
  }
}
