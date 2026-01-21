import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  sidebarOpen = false;

  constructor(
    public auth: AuthService,
    private router: Router,
  ) {}

  toggleSidebar() {
  if (this.auth.user()?.role_id === 2) return;
  this.sidebarOpen = !this.sidebarOpen;
}


  async onLogout() {
    await this.auth.logout();
    this.sidebarOpen = false;
    this.router.navigate(['/login']);
  }
}
