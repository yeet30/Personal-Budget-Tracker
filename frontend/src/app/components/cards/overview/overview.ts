import { Component, Input, OnInit, signal } from '@angular/core';
import { BudgetRow } from '../../../services/budget-service';
import { TransactionService, TransactionRow } from '../../../services/transaction-service';
import { AuthService } from '../../../services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overview-card',
  imports: [CommonModule],
  templateUrl: './overview.html',
  styleUrl: '../cards-common.scss',
})
export class Overview implements OnInit {
  @Input({ required: true })
  budget!: () => BudgetRow | null;

  transactions = signal<TransactionRow[]>([]);
  loadingTransactions = signal(false);

  constructor(private transactionService: TransactionService, private authService: AuthService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  async loadTransactions() {
    const b = this.budget();
    if (!b) return;

    this.loadingTransactions.set(true);
    try {
      const res = await this.transactionService.getTransactions(b.budget_id);
      this.transactions.set(res.transactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      this.loadingTransactions.set(false);
    }
  }

  getMyRoleLabel(): string {
    const b: any = this.budget();
    return b?.type || 'contributor';
  }

  isOwner(): boolean {
    const b = this.budget();
    return b?.type === 'OWNER';
  }

  canEditTransaction(transaction: TransactionRow): boolean {
    const currentUser = this.authService.user();
    if (!currentUser) return false;
    
    if (this.isOwner()) return true;
    
    return transaction.user_id === currentUser.user_id;
  }

  canEditAnyTransaction(): boolean {
    return this.transactions().some(t => this.canEditTransaction(t));
  }

  getTotalIncome(): number {
    return this.transactions().filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpense(): number {
    return this.transactions().filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  }

  getNetAmount(): number {
    return this.getTotalIncome() - this.getTotalExpense();
  }

  editTransaction(transaction: TransactionRow) {
    const b = this.budget();
    if (!b) return;

    const newCategory = prompt('Category:', transaction.category_name);
    const newAmount = prompt('Amount:', transaction.amount.toString());
    const newType = prompt('Type (INCOME/EXPENSE):', transaction.type);
    const newDate = prompt('Date (YYYY-MM-DD):', transaction.date);
    const newDescription = prompt('Description:', transaction.description || '');

    if (!newCategory || !newAmount || !newType || !newDate) {
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    if (newType !== 'INCOME' && newType !== 'EXPENSE') {
      alert('Type must be INCOME or EXPENSE');
      return;
    }

    this.updateTransaction(transaction.transaction_id, {
      category: newCategory,
      amount: amount,
      currency: transaction.currency,
      type: newType as 'INCOME' | 'EXPENSE',
      date: newDate,
      description: newDescription || undefined
    });
  }

  async updateTransaction(transactionId: number, data: any) {
    const b = this.budget();
    if (!b) return;

    try {
      await this.transactionService.updateTransaction(b.budget_id, transactionId, data);
      await this.loadTransactions();
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction: ' + (error?.error?.message || 'Unknown error'));
    }
  }

  async deleteTransaction(transaction: TransactionRow) {
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      try {
        const b = this.budget();
        if (!b) return;

        await this.transactionService.deleteTransaction(b.budget_id, transaction.transaction_id);
        await this.loadTransactions();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  }
}
