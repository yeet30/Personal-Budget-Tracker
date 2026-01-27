import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AuthService } from "../../services/auth-service";
import { BudgetRow, BudgetService } from "../../services/budget-service";
import { UserService, controlTransactionRow, controlBudgetRow } from "../../services/user-service";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit {
  budgets = signal<BudgetRow[]>([]);
  allBudgets = signal<controlBudgetRow[]>([]);
  allTransactions = signal<controlTransactionRow[]>([]);
  has_budgets = signal<boolean>(true);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    private budgetService: BudgetService,
    private userService: UserService,
  ) {}

  async ngOnInit(){
    if (this.isControl()) {
      await this.loadAllBudgets();
      await this.loadBudgets();
      await this.loadAllTransactions();
    } else {
      await this.loadBudgets();
    }
    if(this.budgets().length === 0) 
      this.has_budgets.set(true)
    console.log(this.allTransactions())

  }

  isAdmin(): boolean {
    return this.auth.user()?.role_id === 2;
  }

  isControl(): boolean {
    return this.auth.user()?.role_id === 3;
  }

  async loadBudgets() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const res: any = await this.budgetService.listMyBudgets();
      this.budgets.set(res?.budgets ?? []);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to load budgets.');
      this.budgets.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAllBudgets() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await this.userService.controlGetAllBudgets();
      this.allBudgets.set(res.budgets);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to load budgets.');
      this.allBudgets.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAllTransactions() {
    try {
      const res = await this.userService.controlGetAllTransactions();
      this.allTransactions.set(res.transactions);
      console.log(res.transactions)
    } catch (e: any) {
      console.error('Failed to load transactions:', e);
    }
  }

}
