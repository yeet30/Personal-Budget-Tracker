import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../services/transaction-service';

type side = 'income' | 'expense';
export type IncomeCategory = 'salary' | 'income from self employment' | 'allowance' | 'government aid' | 'savings' | 'addition';
export type ExpenseCategory = 'rent' | 'insurance' | 'groceries' | 'bills' | 'dinning' | 'cinema' | 'travel';

export type Transaction = {
  type: IncomeCategory | ExpenseCategory;
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

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  async loadTransactions() {
    try {
      const res = await this.transactionService.getTransactions(this.budgetId);
      this.savedTransactions.set(res.transactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }

  selected_side = signal<side>('income');

  income_category = signal<IncomeCategory>('salary')
  income_amount = signal<string>('');
  savings_category = signal<IncomeCategory>('savings')
  savings_amount = signal<string>('');

  cost_category = signal<ExpenseCategory>('rent')
  cost_amount = signal<string>('');
  leisure_category = signal<ExpenseCategory>('dinning')
  leisure_amount = signal<string>('');

  transaction_array = signal<Transaction[]>([]);
  total_amount = signal<number>(0);
  savedTransactions = signal<any[]>([]);

  
  async addStableIncome(){
    const amount = parseInt(this.income_amount());
    if (!amount || amount <= 0) return;

    const income: Transaction = {
      type: this.income_category(),
      amount: amount,
      stable: true
    }
    this.total_amount.set(this.total_amount() + amount)
    this.transaction_array.set([...this.transaction_array(), income])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: this.income_category(),
        amount: amount,
        currency: this.currency,
        type: 'INCOME',
        date: new Date().toISOString().split('T')[0],
        description: 'Stable income'
      });
      this.income_amount.set('');
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  async addSavings(){
    const amount = parseInt(this.savings_amount());
    if (!amount || amount <= 0) return;

    const income: Transaction = {
      type: this.savings_category(),
      amount: amount,
      stable: false
    }
    this.total_amount.set(this.total_amount() + amount)
    this.transaction_array.set([...this.transaction_array(), income])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: this.savings_category(),
        amount: amount,
        currency: this.currency,
        type: 'INCOME',
        date: new Date().toISOString().split('T')[0],
        description: 'Savings'
      });
      this.savings_amount.set('');
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  async addFixedCost(){
    const amount = parseInt(this.cost_amount());
    if (!amount || amount <= 0) return;

    const cost: Transaction = {
      type: this.cost_category(),
      amount: amount*-1,
      stable: true
    }
    this.total_amount.set(this.total_amount() - amount)
    this.transaction_array.set([...this.transaction_array(), cost])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: this.cost_category(),
        amount: amount,
        currency: this.currency,
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        description: 'Fixed cost'
      });
      this.cost_amount.set('');
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  async addLeisure(){
    const amount = parseInt(this.leisure_amount());
    if (!amount || amount <= 0) return;

    const cost: Transaction = {
      type: this.leisure_category(),
      amount: amount*-1,
      stable: false
    }
    this.total_amount.set(this.total_amount() - amount)
    this.transaction_array.set([...this.transaction_array(), cost])

    try {
      await this.transactionService.createTransaction(this.budgetId, {
        category: this.leisure_category(),
        amount: amount,
        currency: this.currency,
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        description: 'Leisure'
      });
      this.leisure_amount.set('');
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  setSide(side:side){
    this.selected_side.set(side)
  }
}
