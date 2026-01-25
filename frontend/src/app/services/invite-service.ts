import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type PendingInviteRow = {
  invite_id: number;
  budget_id: number;
  budget_name: string;
  invited_by_user_id: number;
  invited_by_username: string;
  created_at: string;
};

@Injectable({ providedIn: 'root' })
export class InviteService {
  constructor(private http: HttpClient) {}

  async pending(): Promise<{ invites: PendingInviteRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ invites: PendingInviteRow[] }>(`/api/invites/pending`, {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async respond(inviteId: number, action: 'ACCEPT' | 'DENY'): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post(
          `/api/invites/${inviteId}/respond`,
          { action },
          { withCredentials: true },
        ),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }
}
