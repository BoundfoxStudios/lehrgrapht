import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import * as mathjs from 'mathjs';
import { ConstantNode } from 'mathjs';

@Component({
  selector: 'lg-math-display',
  imports: [],
  templateUrl: './math-display.html',
  styleUrl: './math-display.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MathDisplay {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  math = input.required<string>();
  prefix = input<string>();

  constructor() {
    effect(() => {
      const math = this.math();

      try {
        const parsedMath = mathjs.parse(math);

        this.elementRef.nativeElement.innerHTML = '';

        if (parsedMath instanceof ConstantNode) {
          return;
        }

        let tex = parsedMath.toTex({ parenthesis: 'keep' });
        const prefixValue = this.prefix();
        if (prefixValue) {
          tex = `${prefixValue} ${tex}`;
        }

        this.elementRef.nativeElement.appendChild(MathJax.tex2svg(tex));
      } catch {
        // Noop, just don't do anything.
      }
    });
  }
}
