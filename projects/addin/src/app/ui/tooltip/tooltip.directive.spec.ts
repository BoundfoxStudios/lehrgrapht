import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  template: `
    <ng-template #hint>
      <p>Erster Absatz mit <strong>Hervorhebung</strong></p>
      <p>Zweiter Absatz</p>
    </ng-template>
    <button
      lgTooltip="Kurzer Hinweis"
      type="button"
      aria-label="Ersten Hinweis anzeigen"
    >
      Eins
    </button>
    <button
      [lgTooltip]="hint"
      type="button"
      aria-label="Zweiten Hinweis anzeigen"
    >
      Zwei
    </button>
  `,
  imports: [TooltipDirective],
})
class Host {}

const queryPanels = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="tooltip"]'));

const dispatchPointerEvent = (
  element: Element,
  type: 'pointerenter' | 'pointerleave',
  pointerType = 'mouse',
): void => {
  const event = new Event(type);
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  element.dispatchEvent(event);
};

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<Host>;
  let triggers: HTMLButtonElement[];

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    triggers = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('opens on pointer enter and closes on pointer leave', () => {
    dispatchPointerEvent(triggers[0], 'pointerenter');
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);

    dispatchPointerEvent(triggers[0], 'pointerleave');
    fixture.detectChanges();
    expect(queryPanels().length).toBe(0);
  });

  it('ignores a touch pointer enter and opens on the following tap', () => {
    dispatchPointerEvent(triggers[0], 'pointerenter', 'touch');
    fixture.detectChanges();
    expect(queryPanels().length).toBe(0);

    triggers[0].click();
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);
  });

  it('opens on focus and closes on blur', () => {
    triggers[0].focus();
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);

    triggers[0].blur();
    fixture.detectChanges();
    expect(queryPanels().length).toBe(0);
  });

  it('closes on Escape and reopens on the next activation while focus stays', () => {
    triggers[0].focus();
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(queryPanels().length).toBe(0);

    triggers[0].click();
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);
  });

  it('renders string content', () => {
    dispatchPointerEvent(triggers[0], 'pointerenter');
    fixture.detectChanges();
    expect(queryPanels()[0].textContent.trim()).toBe('Kurzer Hinweis');
  });

  it('renders template content including its markup', () => {
    dispatchPointerEvent(triggers[1], 'pointerenter');
    fixture.detectChanges();
    const panel = queryPanels()[0];
    expect(panel.querySelectorAll('p').length).toBe(2);
    expect(panel.querySelector('strong')?.textContent).toBe('Hervorhebung');
  });

  it('links the trigger to the panel with aria-describedby while open', () => {
    expect(triggers[0].getAttribute('aria-describedby')).toBeNull();

    dispatchPointerEvent(triggers[0], 'pointerenter');
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-describedby')).toBe(
      queryPanels()[0].id,
    );

    dispatchPointerEvent(triggers[0], 'pointerleave');
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-describedby')).toBeNull();
  });

  it('keeps two triggers on the same page independent', () => {
    dispatchPointerEvent(triggers[0], 'pointerenter');
    dispatchPointerEvent(triggers[1], 'pointerenter');
    fixture.detectChanges();

    const panelIds = queryPanels().map(panel => panel.id);
    expect(new Set(panelIds).size).toBe(2);
    expect(panelIds).toContain(triggers[0].getAttribute('aria-describedby'));
    expect(panelIds).toContain(triggers[1].getAttribute('aria-describedby'));

    dispatchPointerEvent(triggers[0], 'pointerleave');
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);
    expect(triggers[1].getAttribute('aria-describedby')).toBe(
      queryPanels()[0].id,
    );
  });

  it('stays open while the pointer moves from the trigger into the panel', () => {
    dispatchPointerEvent(triggers[0], 'pointerenter');
    fixture.detectChanges();
    const panes = document.querySelectorAll('.cdk-overlay-pane');
    expect(panes.length).toBe(1);
    const pane = panes[0];

    dispatchPointerEvent(triggers[0], 'pointerleave');
    dispatchPointerEvent(pane, 'pointerenter');
    fixture.detectChanges();
    expect(queryPanels().length).toBe(1);

    dispatchPointerEvent(pane, 'pointerleave');
    fixture.detectChanges();
    expect(queryPanels().length).toBe(0);
  });
});
