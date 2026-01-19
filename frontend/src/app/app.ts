import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth-service';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
  `,
})
export class App implements OnInit {
  constructor(public auth: AuthService) {}

  async ngOnInit() {
    await this.auth.refreshMe();
    console.log('AFTER REFRESH (me):', this.auth.user());
  }
}
