import { Component, effect, ElementRef, inject, input } from '@angular/core';
import * as mathjs from 'mathjs';
import { ConstantNode } from 'mathjs';

@Component({
  selector: 'lg-math-display',
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

      try {
        const parsedMath = mathjs.parse(math);

        this.elementRef.nativeElement.innerHTML = '';

        if (parsedMath instanceof ConstantNode) {
          return;
        }

        const tex = parsedMath.toTex({ parenthesis: 'keep' });

        this.elementRef.nativeElement.appendChild(MathJax.tex2svg(tex));
      } catch {
        // Noop, just don't do anything.
      }
    });
  }
}
