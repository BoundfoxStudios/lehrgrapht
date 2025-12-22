import { Component } from '@angular/core';
import { ContentContainer } from '../content-container/content-container';

@Component({
  selector: 'lgw-hero',
  imports: [ContentContainer],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {}
