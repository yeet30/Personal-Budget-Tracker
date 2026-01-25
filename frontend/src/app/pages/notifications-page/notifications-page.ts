import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationRow } from '../../services/notification-service';
import { AuthService } from '../../services/auth-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPage implements OnInit, OnDestroy {
  loading = false;
  error = '';
  notifications: NotificationRow[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.auth.refreshMe();
    await this.load();

    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = [...notifications];
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      await this.notificationService.list(false);
    } catch (e: any) {
      this.error = e?.error?.message ?? 'Failed to load notifications.';
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async markRead(n: NotificationRow) {
    try {
      await this.notificationService.markRead(n.notification_id);
    } catch (e: any) {
      this.error = e?.error?.message ?? 'Failed to mark notification as read.';
      this.cdr.detectChanges();
    }
  }

  async readAll() {
    try {
      await this.notificationService.readAll();
    } catch (e: any) {
      this.error = e?.error?.message ?? 'Failed to mark all as read.';
      this.cdr.detectChanges();
    }
  }
}
