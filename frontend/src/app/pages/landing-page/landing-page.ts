import { Component } from '@angular/core';
import { FeaturesPage } from '../features-page/features-page';
import { AboutPage } from '../about-page/about-page';

@Component({
  selector: 'app-landing-page',
  imports: [FeaturesPage,AboutPage],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {

}
