import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Switch } from './switch';

@Component({
  template: `<lg-switch
    [(value)]="value"
    [inputId]="inputId"
    [ariaLabel]="ariaLabel"
  />`,
  imports: [Switch],
})
class Host {
  value = false;
  inputId: string | null = 'host-switch';
  ariaLabel: string | null = 'Switch';
}

function queryButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  const host = fixture.nativeElement as HTMLElement;
  const button = host.querySelector('button');
  if (!button) {
    throw new Error('No button found in lg-switch');
  }
  return button;
}

describe('Switch', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders with role=switch and aria attributes', () => {
    const button = queryButton(fixture);
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Switch');
    expect(button.id).toBe('host-switch');
  });

  it('toggles value on click; aria-checked reflects the new value', () => {
    const button = queryButton(fixture);

    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe(true);
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  it('does not toggle when disabled', () => {
    TestBed.resetTestingModule();
    @Component({
      template: `<lg-switch
        [(value)]="value"
        [disabled]="true"
      />`,
      imports: [Switch],
    })
    class DisabledHost {
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

  it('applies size=small class when size is small', () => {
    TestBed.resetTestingModule();
    @Component({
      template: `<lg-switch
        [(value)]="value"
        size="small"
      />`,
      imports: [Switch],
    })
    class SmallHost {
      value = true;
    }
    const smallFixture = TestBed.createComponent(SmallHost);
    smallFixture.detectChanges();
    const button = queryButton(smallFixture);
    expect(button.classList).toContain('lg-switch--small');
    expect(button.classList).toContain('h-4');
    expect(button.classList).toContain('w-7');
  });

  it('uses size=medium dimensions by default', () => {
    const button = queryButton(fixture);
    expect(button.classList).toContain('h-5');
    expect(button.classList).toContain('w-9');
    expect(button.classList).not.toContain('lg-switch--small');
  });
});
