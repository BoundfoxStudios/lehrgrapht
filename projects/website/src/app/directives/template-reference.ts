import { inject, Injectable, TemplateRef } from '@angular/core';

@Injectable()
export class TemplateReference<T = unknown> {
  readonly template = inject<TemplateRef<T>>(TemplateRef);
}
