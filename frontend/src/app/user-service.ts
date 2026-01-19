import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegisterForm } from './form-validator';

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
}
