import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AuthService } from "../../services/auth-service";
import { BudgetRow, BudgetService } from "../../services/budget-service";

@Component({
  selector: "app-home-page",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
  budgets = signal<BudgetRow[]>([]);
  has_budgets = signal<boolean>(true);
  total_balance = signal<number>(0);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    private budgetService: BudgetService,
  ) {}

  async ngOnInit(){
    this.loadBudgets();
    if(this.budgets().length === 0) 
      this.has_budgets.set(true)

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

}
