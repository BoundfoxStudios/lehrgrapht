import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value?: string, maximum = 200): string {
    if (!value) {
      return '';
    }

    const length = value.length;

    return length > maximum ? `${value.substring(0, maximum)}...` : value;
  }
}
