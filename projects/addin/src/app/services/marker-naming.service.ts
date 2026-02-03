import { Injectable } from '@angular/core';
import { MarkerNamingScheme } from '../models/plot';

@Injectable({ providedIn: 'root' })
export class MarkerNamingService {
  generateName(index: number, scheme: MarkerNamingScheme): string {
    if (scheme === 'numeric') {
      return `P${index + 1}`;
    }

    let result = '';
    let n = index;
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
  }
}
