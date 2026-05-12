import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PillSwitch } from './pill-switch';

@Component({
  template: `<lg-pill-switch
    [(value)]="value"
    [options]="options"
  />`,
  imports: [PillSwitch],
})
class Host {
  options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ];
  value = 'a';
}

function queryButtons(fixture: ComponentFixture<Host>): HTMLButtonElement[] {
  const host = fixture.nativeElement as HTMLElement;
  return Array.from(host.querySelectorAll('button'));
}

describe('PillSwitch', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders one button per option', () => {
    const buttons = queryButtons(fixture);
    expect(buttons.length).toBe(2);
  });

  it('marks the active option with aria-checked=true', () => {
    const buttons = queryButtons(fixture);
    expect(buttons[0].getAttribute('aria-checked')).toBe('true');
    expect(buttons[1].getAttribute('aria-checked')).toBe('false');
  });

  it('updates value on click', () => {
    const buttons = queryButtons(fixture);
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('b');
    expect(buttons[1].getAttribute('aria-checked')).toBe('true');
  });
});
