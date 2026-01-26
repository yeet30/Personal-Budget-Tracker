import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CategoryRow } from './user-service';

export type { CategoryRow };

export type TransactionRow = {
  transaction_id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  amount: number;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  description: string | null;
  created_at: string;
  username: string;
};

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private http: HttpClient) { }

  async getTransactions(budgetId: number): Promise<{ transactions: TransactionRow[] }> {
    return firstValueFrom(this.http.get<{ transactions: TransactionRow[] }>(`/api/budgets/${budgetId}/transactions`));
  }

  async createTransaction(budgetId: number, data: {
    category: string;
    amount: number;
    currency: string;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    description?: string;
  }): Promise<{ transaction: TransactionRow }> {
    return firstValueFrom(this.http.post<{ transaction: TransactionRow }>(`/api/budgets/${budgetId}/transactions`, data));
  }

  async getCategories(): Promise<{ categories: CategoryRow[] }> {
    return firstValueFrom(this.http.get<{ categories: CategoryRow[] }>(`/api/categories`));
  }

  async deleteTransaction(budgetId: number, transactionId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/budgets/${budgetId}/transactions/${transactionId}`));
  }

  async updateTransaction(budgetId: number, transactionId: number, data: {
    category: string;
    amount: number;
    currency: string;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    description?: string;
  }): Promise<{ transaction: TransactionRow }> {
    return firstValueFrom(this.http.put<{ transaction: TransactionRow }>(`/api/budgets/${budgetId}/transactions/${transactionId}`, data));
  }
}
