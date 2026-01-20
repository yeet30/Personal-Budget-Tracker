import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegisterForm } from './form-validator';

export type AdminUserRow = {
  user_id: number;
  email: string;
  username: string;
  role_id: number;
};
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  async addUser(userData: RegisterForm) {
    try {
      return await firstValueFrom(this.http.post('/api/users', userData));
    } catch (e) {
      const err = e as HttpErrorResponse;

      throw {
        status: err.status,
        error: err.error,
        message: err.message,
      };
    }
  }

  async login(emailOrUsername: string, password: string) {
    try {
      return await firstValueFrom(
        this.http.post('/api/auth', { username: emailOrUsername, password }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async me() {
    try {
      return await firstValueFrom(this.http.get('/api/auth'));
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async logout() {
    try {
      return await firstValueFrom(this.http.delete('/api/auth'));
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }
  async adminGetUsers(): Promise<{ users: AdminUserRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ users: AdminUserRow[] }>('/api/admin/users', {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async adminCreateUser(payload: {
    email: string;
    username: string;
    password: string;
    role_id: number;
  }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post('/api/admin/users', payload, { withCredentials: true }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async adminUpdateUser(
    userId: number,
    payload: {
      email?: string;
      username?: string;
      password?: string;
      role_id?: number;
    },
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.put(`/api/admin/users/${userId}`, payload, {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async adminDeleteUser(userId: number): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.delete(`/api/admin/users/${userId}`, {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }
}
