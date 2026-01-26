import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { Sidebar } from '../sidebar/sidebar';
import { NotificationService, NotificationRow } from '../../services/notification-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, Sidebar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  sidebarOpen = false;
  unreadCount = 0;
  private subscription: Subscription = new Subscription();

  constructor(
    public auth: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.unreadCount = notifications.filter(n => n.is_read === 0).length;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleSidebar() {
    if (!this.auth.user() || this.auth.user()?.role_id === 2 || this.auth.user()?.role_id === 3) return;
    this.sidebarOpen = !this.sidebarOpen;
  }

  async onLogout() {
    await this.auth.logout();
    this.sidebarOpen = false;
    this.router.navigate(['/login']);
  }
}
