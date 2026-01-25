import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type NotificationRow = {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: number;
  created_at: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationRow[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  get unreadCount(): number {
    return this.notificationsSubject.value.filter(n => n.is_read === 0).length;
  }

  public unreadCount$ = this.notificationsSubject.pipe(
    map(notifications => notifications.filter(n => n.is_read === 0).length)
  );

  async list(unreadOnly = false): Promise<{ notifications: NotificationRow[] }> {
    try {
      const suffix = unreadOnly ? '?unreadOnly=1' : '';
      const result = await firstValueFrom(
        this.http.get<{ notifications: NotificationRow[] }>(`/api/notifications${suffix}`, {
          withCredentials: true,
        }),
      );
      this.notificationsSubject.next(result.notifications ?? []);
      return result;
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async markRead(id: number): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.http.patch(`/api/notifications/${id}/read`, {}, { withCredentials: true }),
      );
      const current = this.notificationsSubject.value;
      const updated = current.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n);
      this.notificationsSubject.next(updated);
      return result;
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async readAll(): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.http.patch(`/api/notifications/read-all`, {}, { withCredentials: true }),
      );
      const current = this.notificationsSubject.value;
      const updated = current.map(n => ({ ...n, is_read: 1 }));
      this.notificationsSubject.next(updated);
      return result;
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }
}
