import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { Header } from './components/header/header';
import { InviteService, PendingInviteRow } from './services/invite-service';
import { NotificationService } from './services/notification-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header],
  template: `
    <app-header></app-header>

    <main class="app-content">
      <router-outlet></router-outlet>
    </main>

    <div class="modal-backdrop" *ngIf="showInviteModal">
      <div class="modal">
        <h3>Budget invite</h3>

        <p *ngIf="activeInvite">
          <b>{{ activeInvite.invited_by_username }}</b> invited you to join
          <b>{{ activeInvite.budget_name }}</b>.
        </p>

        <div class="modal-actions">
          <button class="btn" (click)="respondInvite('ACCEPT')">Accept</button>
          <button class="btn" (click)="respondInvite('DENY')">Deny</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .modal {
        width: min(460px, 92vw);
        background: #fff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      .btn {
        border: 1px solid #1f1f1f;
        background: #fff;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
      }
    `,
  ],
})
export class App implements OnInit, OnDestroy {
  private inviteTimer: any = null;
  private notifTimer: any = null;

  showInviteModal = false;
  activeInvite: PendingInviteRow | null = null;

  constructor(
    public auth: AuthService,
    private router: Router,
    private inviteService: InviteService,
  
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {  this.auth.refreshMe();
}

  async ngOnInit() {
    await this.auth.refreshMe();

    this.startNotificationPolling();

    const u = this.auth.user();
    const url = this.router.url;

    if (u?.role_id === 2 && (url === '/' || url === '/login' || url === '/register')) {
      this.router.navigate(['/admin/users']);
    }

    if (u?.role_id !== 2 && u && (url === '/' || url === '/login' || url === '/register')) {
      this.router.navigate(['/home']);
    }

    this.startInvitePolling();
  }


  private startNotificationPolling() {
    if (this.notifTimer) clearInterval(this.notifTimer);

    this.notifTimer = setInterval(async () => {
      const u = this.auth.user();
      if (!u || u.role_id === 2) return;

      try {
        await this.notificationService.list();
      } catch {
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.inviteTimer) clearInterval(this.inviteTimer);
  }

  private startInvitePolling() {
    if (this.inviteTimer) clearInterval(this.inviteTimer);
    this.inviteTimer = setInterval(async () => {
      const u = this.auth.user();
      if (!u || u.role_id === 2) return;
      if (this.showInviteModal) return;

      try {
        const res = await this.inviteService.pending();
        const invites = res.invites ?? [];
        if (invites.length > 0) {
          this.activeInvite = invites[0];
          this.showInviteModal = true;
          this.cdr.detectChanges();
        }
      } catch {
      }
    }, 2500);
  }

  async respondInvite(action: 'ACCEPT' | 'DENY') {
    if (!this.activeInvite) return;
    try {
      await this.inviteService.respond(this.activeInvite.invite_id, action);
    } finally {
      this.showInviteModal = false;
      this.activeInvite = null;
      this.cdr.detectChanges();
    }
  }
}