import { Component } from '@angular/core';
import { Header } from '../header/header';
import { ContentContainer } from '../content-container/content-container';

@Component({
  selector: 'app-cannot-run-online',
  imports: [Header, ContentContainer],
  templateUrl: './cannot-run-online.html',
  styleUrl: './cannot-run-online.css',
})
export class CannotRunOnline {}
