import { Component, contentChild, Directive, input } from '@angular/core';
import { QuadrillePaper } from '../quadrille-paper/quadrille-paper';
import { ContentContainer } from '../content-container/content-container';
import { NgTemplateOutlet } from '@angular/common';
import { TemplateReference } from '../../directives/template-reference';

@Directive({
  selector: '[lgwSectionHandwritten]',
})
export class SectionHandwritten extends TemplateReference {}

@Directive({
  selector: '[lgwSectionHeadline]',
})
export class SectionHeadline extends TemplateReference {}

@Directive({
  selector: '[lgwSectionContent]',
})
export class SectionContent extends TemplateReference {}

@Directive({
  selector: '[lgwSectionSideContent]',
})
export class SectionSideContent extends TemplateReference {}

@Component({
  selector: 'lgw-section',
  imports: [QuadrillePaper, ContentContainer, NgTemplateOutlet],
  templateUrl: './section.html',
  styleUrl: './section.css',
  host: { class: 'block', '[class.py-20]': "variant() === 'normal'" },
})
export class Section {
  readonly variant = input<'normal' | 'quadrille paper'>('normal');
  readonly headerSide = input<'top' | 'left' | 'right'>('top');
  readonly handwrittenTemplate = contentChild(SectionHandwritten);
  readonly headlineTemplate = contentChild(SectionHeadline);
  readonly contentTemplate = contentChild(SectionContent);
  readonly sideContentTemplate = contentChild(SectionSideContent);
}
