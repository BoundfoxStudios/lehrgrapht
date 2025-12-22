import { Component } from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { ContentContainer } from '../../components/content-container/content-container';

@Component({
  selector: 'lgw-privacy-policy-page',
  imports: [Hero, ContentContainer],
  templateUrl: './privacy-policy-page.html',
  styleUrl: './privacy-policy-page.css',
})
export class PrivacyPolicyPage {}
