import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegisterForm } from '../form-validator';

export type AdminUserRow = {
  user_id: number;
  email: string;
  username: string;
  role_id: number;
};

export type RoleRow = {
  role_id: number;
  name: string;
};

export type CategoryRow = {
  category_id: number;
  name: string;
  description: string | null;
  category_type: string;
  created_at: string;
};

export type controlBudgetRow = {
  budget_id: number;
  name: string;
  currency: string;
  start_date: string;
  end_date: string;
  owner_username: string;
};

export type controlTransactionRow = {
  transaction_id: number;
  category_id: number;
  budget_id: number;
  user_id: number;
  amount: number;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  description: string | null;
  created_at: string;
  username: string;
  budget_name: string;
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

  async adminGetRoles(): Promise<{ roles: RoleRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ roles: RoleRow[] }>('/api/admin/roles', {
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
      category_type?: string;
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

  async adminGetCategories(): Promise<{ categories: CategoryRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ categories: CategoryRow[] }>('/api/admin/categories', {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async adminCreateCategory(payload: {
    name: string;
    description?: string;
    category_type?: string;
  }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post('/api/admin/categories', payload, {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async adminUpdateCategory(
    categoryId: number,
    payload: {
      name?: string;
      description?: string;
      category_type?: string;
    },
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.put(`/api/admin/categories/${categoryId}`, payload, {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async adminDeleteCategory(categoryId: number): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.delete(`/api/admin/categories/${categoryId}`, {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async controlGetAllBudgets(): Promise<{ budgets: controlBudgetRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ budgets: controlBudgetRow[] }>('/api/control/budgets', {
          withCredentials: true,
        })
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async controlGetAllTransactions(): Promise<{ transactions: controlTransactionRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ transactions: controlTransactionRow[] }>('/api/control/transactions', {
          withCredentials: true,
        })
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }
}
