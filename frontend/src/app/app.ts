import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  template: `
    <app-header></app-header>

    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class App implements OnInit {
  constructor(
    public auth: AuthService,
    private router: Router,
  ) {  this.auth.refreshMe();
}

  async ngOnInit() {
    await this.auth.refreshMe();

    const u = this.auth.user();
    const url = this.router.url;

    if (u?.role_id === 2 && (url === '/' || url === '/login' || url === '/register')) {
      this.router.navigate(['/admin/users']);
    }

    if (u?.role_id !== 2 && u && (url === '/' || url === '/login' || url === '/register')) {
      this.router.navigate(['/home']);
    }
  }
}
