import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

export type BudgetRow = {
  budget_id: number;
  name: string;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() open = false;

  @Input() budgets: BudgetRow[] = [];
  @Input() selectedBudgetId: number | null = null;

  @Output() close = new EventEmitter<void>();

  query = '';

  constructor(public auth: AuthService, private router: Router) {}

  toggleClose() {
    this.close.emit();
  }

  get filteredBudgets(): BudgetRow[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.budgets;
    return this.budgets.filter((b) => b.name.toLowerCase().includes(q));
  }

  goToBudget(id: number) {
    this.router.navigate(['/budgets', id]);
    this.toggleClose();
  }

  goToNewBudget() {
    this.router.navigate(['/budgets/new']);
    this.toggleClose();
  }
}
