import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ToggleRow } from './toggle-row';

@Component({
  template: `<lg-toggle-row
    [(value)]="value"
    [label]="label"
    [sub]="sub"
  />`,
  imports: [ToggleRow],
})
class Host {
  label = 'Show grid';
  sub = 'Display the background grid';
  value = false;
}

function queryButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  const host = fixture.nativeElement as HTMLElement;
  const button = host.querySelector('button');
  if (!button) {
    throw new Error('No button found in lg-toggle-row');
  }
  return button;
}

function queryLabel(fixture: ComponentFixture<unknown>): HTMLLabelElement {
  const host = fixture.nativeElement as HTMLElement;
  const label = host.querySelector('label');
  if (!label) {
    throw new Error('No label found in lg-toggle-row');
  }
  return label;
}

describe('ToggleRow', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders label and optional subtext', () => {
    const host = fixture.nativeElement as HTMLElement;
    const label = queryLabel(fixture);
    expect(label.textContent).toContain('Show grid');
    expect(host.textContent).toContain('Display the background grid');
  });

  it('toggles value on click; aria-checked reflects the new value', () => {
    const button = queryButton(fixture);
    expect(button.getAttribute('aria-checked')).toBe('false');

    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  it('does not toggle when disabled', () => {
    TestBed.resetTestingModule();
    @Component({
      template: `<lg-toggle-row
        [(value)]="value"
        [label]="label"
        [disabled]="true"
      />`,
      imports: [ToggleRow],
    })
    class DisabledHost {
      label = 'Show grid';
      value = false;
    }
    const disabledFixture = TestBed.createComponent(DisabledHost);
    disabledFixture.detectChanges();
    const button = queryButton(disabledFixture);
    button.click();
    disabledFixture.detectChanges();
    expect(disabledFixture.componentInstance.value).toBe(false);
    expect(button.getAttribute('aria-checked')).toBe('false');
  });

  it('toggles when clicking the label (via for/id association)', () => {
    const label = queryLabel(fixture);
    const button = queryButton(fixture);
    expect(label.getAttribute('for')).toBe(button.id);
    expect(button.id).toBeTruthy();

    label.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
  });
});
