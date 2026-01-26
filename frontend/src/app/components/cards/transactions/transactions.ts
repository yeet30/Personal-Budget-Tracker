import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class Transactions {
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

  
  addStableIncome(){
    const income: Transaction = {
      type: this.income_category(),
      amount: parseInt(this.income_amount()),
      stable: true
    }
    this.total_amount.set(this.total_amount() + parseInt(this.income_amount()))
    this.transaction_array.set([...this.transaction_array(), income])
  }

  addSavings(){
    const income: Transaction = {
      type: this.savings_category(),
      amount: parseInt(this.savings_amount()),
      stable: false
    }
    this.total_amount.set(this.total_amount() + parseInt(this.savings_amount()))
    this.transaction_array.set([...this.transaction_array(), income])
  }

  addFixedCost(){
    const cost: Transaction = {
      type: this.cost_category(),
      amount: parseInt(this.cost_amount())*-1,
      stable: true
    }
    this.total_amount.set(this.total_amount() - parseInt(this.cost_amount()))
    this.transaction_array.set([...this.transaction_array(), cost])
  }

  addLeisure(){
    const cost: Transaction = {
      type: this.leisure_category(),
      amount: parseInt(this.leisure_amount())*-1,
      stable: false
    }
    this.total_amount.set(this.total_amount() - parseInt(this.leisure_amount()))
    this.transaction_array.set([...this.transaction_array(), cost])
  }

  setSide(side:side){
    this.selected_side.set(side)
  }
}
