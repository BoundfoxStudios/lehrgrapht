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

function queryButtons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
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

  it('does not update value when disabled', () => {
    TestBed.resetTestingModule();
    @Component({
      template: `<lg-pill-switch
        [(value)]="value"
        [options]="options"
        [disabled]="true"
      />`,
      imports: [PillSwitch],
    })
    class DisabledHost {
      options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];
      value = 'a';
    }
    const disabledFixture = TestBed.createComponent(DisabledHost);
    disabledFixture.detectChanges();
    const buttons = queryButtons(disabledFixture);
    buttons[1].click();
    disabledFixture.detectChanges();
    expect(disabledFixture.componentInstance.value).toBe('a');
  });

  it('renders one row per group when options is a 2D array', () => {
    TestBed.resetTestingModule();
    @Component({
      template: `<lg-pill-switch
        [(value)]="value"
        [options]="options"
      />`,
      imports: [PillSwitch],
    })
    class GroupedHost {
      options = [
        [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        [
          { value: 'c', label: 'C' },
          { value: 'd', label: 'D' },
        ],
      ];
      value = 'a';
    }
    const groupedFixture = TestBed.createComponent(GroupedHost);
    groupedFixture.detectChanges();
    const host = groupedFixture.nativeElement as HTMLElement;
    const switchEl = host.querySelector('lg-pill-switch');
    const rows = switchEl?.querySelectorAll(':scope > div') ?? [];
    expect(rows.length).toBe(2);
    expect(rows[0].querySelectorAll('button').length).toBe(2);
    expect(rows[1].querySelectorAll('button').length).toBe(2);
  });

  it('applies rounded-full when shape is pill', () => {
    TestBed.resetTestingModule();
    @Component({
      template: `<lg-pill-switch
        [(value)]="value"
        [options]="options"
        shape="pill"
      />`,
      imports: [PillSwitch],
    })
    class PillHost {
      options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];
      value = 'a';
    }
    const pillFixture = TestBed.createComponent(PillHost);
    pillFixture.detectChanges();
    const host = pillFixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(button?.classList.contains('rounded-full')).toBe(true);
    expect(button?.classList.contains('rounded-base')).toBe(false);
  });
});
