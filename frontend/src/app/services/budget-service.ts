import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type BudgetRow = {
  budget_id: number;
  name: string;
  currency: string;
  start_date: string;
  end_date: string | null;
  created_at?: string;
  type: 'OWNER' | 'CONTRIBUTOR';
};


@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private http: HttpClient) {}

  async listMyBudgets(): Promise<{ budgets: BudgetRow[] }> {
    try {
      return await firstValueFrom(
        this.http.get<{ budgets: BudgetRow[] }>('/api/budgets', {
          withCredentials: true,
        }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async createBudget(payload: {
    name: string;
    currency: string;
    start_date: string;
    end_date: string;
  }): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post('/api/budgets', payload, { withCredentials: true }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async addUserToBudget(budgetId: number, identifier: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post(`/api/budgets/${budgetId}/users`, { identifier }, { withCredentials: true }),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }

  async getBudget(id: number): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`/api/budgets/${id}`, { withCredentials: true }));
    } catch (e) {
      const err = e as HttpErrorResponse;
      throw { status: err.status, error: err.error, message: err.message };
    }
  }
}
