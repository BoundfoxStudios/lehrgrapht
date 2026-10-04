import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { Input } from './input';

@Component({
  template: `<lg-input
    id="limit"
    [field]="limitForm.limit"
    type="number"
  />`,
  imports: [Input],
})
class Host {
  readonly limitForm = form(signal({ limit: 1 }), schema => {
    required(schema.limit, { message: 'Die Grenze darf nicht leer sein' });
  });
}

function queryInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
  const input = (fixture.nativeElement as HTMLElement).querySelector('input');
  if (!input) {
    throw new Error('No input found in lg-input');
  }
  return input;
}

function errorMessages(fixture: ComponentFixture<unknown>): string[] {
  const host = fixture.nativeElement as HTMLElement;
  return Array.from(host.querySelectorAll('li'), item =>
    item.textContent.trim(),
  );
}

describe('Input', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows a readable message when the number input cannot be parsed', () => {
    const input = queryInput(fixture);
    // jsdom never reports badInput; a browser does for "-" or "1e" in a number input
    Object.defineProperty(input, 'validity', { value: { badInput: true } });

    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(errorMessages(fixture)).toEqual(['Bitte gib eine gültige Zahl ein']);
  });

  it('shows the validator message for errors that are not parse errors', () => {
    const input = queryInput(fixture);

    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(errorMessages(fixture)).toEqual(['Die Grenze darf nicht leer sein']);
  });

  it('shows only the readable message when a cleared number input cannot be parsed', () => {
    const input = queryInput(fixture);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    Object.defineProperty(input, 'validity', { value: { badInput: true } });

    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(errorMessages(fixture)).toEqual(['Bitte gib eine gültige Zahl ein']);
  });
});
