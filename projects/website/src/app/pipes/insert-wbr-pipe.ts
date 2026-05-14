import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'insertWbr',
})
export class InsertWbrPipe implements PipeTransform {
  private readonly domSanitizer = inject(DomSanitizer);

  transform(text: string): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(
      text.replace('/', '/<wbr>'),
    );
  }
}
