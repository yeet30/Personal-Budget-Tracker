import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink} from '@angular/router';

import { BudgetRow, BudgetService } from '../../../services/budget-service';
import { TransactionService, TransactionRow, CategoryRow } from '../../../services/transaction-service';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeleteBudget } from '../../delete-budget/delete-budget';

@Component({
  selector: 'app-overview-card',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './overview.html',
  styleUrl: '../cards-common.scss',
})
export class Overview implements OnInit {
  @Input({ required: true })
  budget!: WritableSignal<BudgetRow | null>;
  error = signal<string>('');

  transactions = signal<TransactionRow[]>([]);
  loadingTransactions = signal(false);
  categories = signal<CategoryRow[]>([]);

  editingId = signal<number | null>(null);
  editForm = signal({
    category_id: 0,
    amount: '',
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    date: '',
    description: '',
  });

  decision : boolean = false;

  constructor(
    private budgetService: BudgetService, 
    private transactionService: TransactionService, 
    private authService: AuthService, 
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadCategories();
  }

  deleteBudget() {
    const dialogRef = this.dialog.open(DeleteBudget, {
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async dec => {
      if (!dec) return;

      const budgetValue = this.budget();
      if (budgetValue) {
        await this.budgetService.deleteBudget({ name: budgetValue.name });
        this.router.navigate(['/login']);
      }
    });
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

  async loadCategories() {
    try {
      const res = await this.transactionService.getCategories();
      this.categories.set(res.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
    this.editingId.set(transaction.transaction_id);
    this.editForm.set({
      category_id: transaction.category_id,
      amount: transaction.amount.toString(),
      type: transaction.type,
      date: transaction.date,
      description: transaction.description || '',
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm.set({
      category_id: 0,
      amount: '',
      type: 'INCOME',
      date: '',
      description: '',
    });
  }

  async saveEdit() {
    const id = this.editingId();
    if (!id) return;

    const form = this.editForm();
    const amount = parseFloat(form.amount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    if (form.type !== 'INCOME' && form.type !== 'EXPENSE') {
      alert('Type must be INCOME or EXPENSE');
      return;
    }

    const category = this.categories().find(c => c.category_id === form.category_id);
    if (!category) {
      alert('Please select a valid category');
      return;
    }

    try {
      await this.transactionService.updateTransaction(this.budget()!.budget_id, id, {
        category: category.name,
        amount: amount,
        currency: this.budget()!.currency,
        type: form.type,
        date: form.date,
        description: form.description || undefined
      });

      this.editingId.set(null);
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction');
    }
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

  async addNewCategory() {
    const categoryName = prompt('Enter new category name:');
    if (!categoryName || !categoryName.trim()) return;

    const description = prompt('Enter category description (optional):');

    try {
      await this.userService.adminCreateCategory({
        name: categoryName.trim(),
        description: description?.trim() || undefined,
      });

      // Reload categories to include the new one
      await this.loadCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('Failed to add category. You may not have admin permissions.');
    }
  }

  isAdmin(): boolean {
    return this.authService.user()?.role_id === 2;
  }
}
