import { booleanAttribute, Component, input } from '@angular/core';

@Component({
  selector: 'lgw-quadrille-paper',
  imports: [],
  templateUrl: './quadrille-paper.html',
  styleUrl: './quadrille-paper.css',
  host: {
    '[class.cream]': "variant() === 'cream'",
    '[class.with-border]': 'hasBorder()',
  },
})
export class QuadrillePaper {
  readonly variant = input<'normal' | 'cream'>('cream');
  readonly hasBorder = input(false, { transform: booleanAttribute });
}
