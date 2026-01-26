<<<<<<< HEAD
import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { BudgetRow, BudgetService } from '../../../services/budget-service';
import { TransactionService, TransactionRow, CategoryRow } from '../../../services/transaction-service';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
=======
import { Component, Input, signal, WritableSignal } from '@angular/core';
import { BudgetRow, BudgetService } from '../../../services/budget-service';

>>>>>>> budget-page-changes

@Component({
  selector: 'app-overview-card',
  imports: [],
  templateUrl: './overview.html',
  styleUrl: '../cards-common.scss',
})
export class Overview {
  @Input({ required: true })
  budget!: WritableSignal<BudgetRow | null>;
  error = signal<string>('');

<<<<<<< HEAD
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

  constructor(private budgetService: BudgetService, private transactionService: TransactionService, private authService: AuthService, private userService: UserService) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadCategories();
  }
=======

  constructor(private budgetSerive:BudgetService){}
>>>>>>> budget-page-changes

  async deleteBudget(){
    const budgetValue = this.budget();
    if (budgetValue) {
<<<<<<< HEAD
      await this.budgetService.deleteBudget({name: budgetValue.name})
    }
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
=======
      await this.budgetSerive.deleteBudget({name: budgetValue.name})
>>>>>>> budget-page-changes
    }
  }

  getMyRoleLabel(): string {
    const b: any = this.budget();
    return b?.type || 'contributor';
  }
}
