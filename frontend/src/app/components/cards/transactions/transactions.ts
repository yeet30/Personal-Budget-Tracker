import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, CategoryRow } from '../../../services/transaction-service';

type side = 'income' | 'expense';

export type Transaction = {
  type: string; // Will be category name
  amount: number;
  stable: boolean;
}

@Component({
  selector: 'app-transactions-card',
  imports: [CommonModule,FormsModule],
  templateUrl: './transactions.html',
  styleUrl: '../cards-common.scss',
})
export class Transactions implements OnInit {
  @Input({ required: true })
  budgetId!: number;

  @Input({ required: true })
  currency!: string;

  categories = signal<CategoryRow[]>([]);
  loadingCategories = signal<boolean>(false);

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadCategories();
  }

  async loadTransactions() {
    try {
      const res = await this.transactionService.getTransactions(this.budgetId);
      this.savedTransactions.set(res.transactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }

  async loadCategories() {
    try {
      this.loadingCategories.set(true);
      const res = await this.transactionService.getCategories();
      this.categories.set(res.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      this.loadingCategories.set(false);
    }
  }

  selected_side = signal<side>('income');

  income_category_id = signal<number | null>(null);
  income_amount = signal<string>('');

  savings_category_id = signal<number | null>(null);
  savings_amount = signal<string>('');

  cost_category_id = signal<number | null>(null);
  cost_amount = signal<string>('');

  leisure_category_id = signal<number | null>(null);
  leisure_amount = signal<string>('');

  transaction_array = signal<Transaction[]>([]);
  total_amount = signal<number>(0);
  savedTransactions = signal<any[]>([]);

  
  async addStableIncome(){
    const amount = parseInt(this.income_amount());
    if (!amount || amount <= 0) return;

    const categoryId = this.income_category_id();
    if (!categoryId) return;

    const category = this.categories().find(c => c.category_id === categoryId);
    if (!category) return;

    const income: Transaction = {
      type: category.name,
      amount: amount,
      stable: true
    }
    this.total_amount.set(this.total_amount() + amount)
    this.transaction_array.set([...this.transaction_array(), income])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: category.name,
        amount: amount,
        currency: this.currency,
        type: 'INCOME',
        date: new Date().toISOString().split('T')[0],
        description: 'Stable income'
      });
      this.income_amount.set('');
      this.income_category_id.set(null);
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  async addSavings(){
    const amount = parseInt(this.savings_amount());
    if (!amount || amount <= 0) return;

    const categoryId = this.savings_category_id();
    if (!categoryId) return;

    const category = this.categories().find(c => c.category_id === categoryId);
    if (!category) return;

    const income: Transaction = {
      type: category.name,
      amount: amount,
      stable: false
    }
    this.total_amount.set(this.total_amount() + amount)
    this.transaction_array.set([...this.transaction_array(), income])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: category.name,
        amount: amount,
        currency: this.currency,
        type: 'INCOME',
        date: new Date().toISOString().split('T')[0],
        description: 'Savings'
      });
      this.savings_amount.set('');
      this.savings_category_id.set(null);
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  async addFixedCost(){
    const amount = parseInt(this.cost_amount());
    if (!amount || amount <= 0) return;

    const categoryId = this.cost_category_id();
    if (!categoryId) return;

    const category = this.categories().find(c => c.category_id === categoryId);
    if (!category) return;

    const cost: Transaction = {
      type: category.name,
      amount: amount*-1,
      stable: true
    }
    this.total_amount.set(this.total_amount() - amount)
    this.transaction_array.set([...this.transaction_array(), cost])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: category.name,
        amount: amount,
        currency: this.currency,
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        description: 'Fixed cost'
      });
      this.cost_amount.set('');
      this.cost_category_id.set(null);
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  async addLeisure(){
    const amount = parseInt(this.leisure_amount());
    if (!amount || amount <= 0) return;

    const categoryId = this.leisure_category_id();
    if (!categoryId) return;

    const category = this.categories().find(c => c.category_id === categoryId);
    if (!category) return;

    const cost: Transaction = {
      type: category.name,
      amount: amount*-1,
      stable: false
    }
    this.total_amount.set(this.total_amount() - amount)
    this.transaction_array.set([...this.transaction_array(), cost])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: category.name,
        amount: amount,
        currency: this.currency,
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        description: 'Leisure'
      });
      this.leisure_amount.set('');
      this.leisure_category_id.set(null);
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  setSide(side:side){
    this.selected_side.set(side)
  }
}
