import { Component, effect, ElementRef, inject, input } from '@angular/core';
import * as mathjs from 'mathjs';

@Component({
  selector: 'app-math-display',
  imports: [],
  templateUrl: './math-display.html',
  styleUrl: './math-display.css',
})
export class MathDisplay {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  math = input.required<string>();

  constructor() {
    effect(() => {
      const math = this.math();

      const tex = mathjs.parse(math).toTex({ parenthesis: 'keep' });

      this.elementRef.nativeElement.innerHTML = '';
      this.elementRef.nativeElement.appendChild(MathJax.tex2svg(tex));
    });
  }
}
