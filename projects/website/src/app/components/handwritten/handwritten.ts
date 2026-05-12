import { Component } from '@angular/core';

@Component({
  selector: 'lgw-handwritten',
  templateUrl: './handwritten.html',
  styleUrl: './handwritten.css',
  host: {
    class: `font-hand text-brand block`,
  },
})
export class Handwritten {}
