import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../services/auth-service';
import { BudgetService } from '../../services/budget-service';
import { BudgetInitializer } from '../budget-initializer/budget-initializer';
import { BudgetRow } from '../../services/budget-service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})

export class Sidebar {
  @Output() close = new EventEmitter<void>();

  private _open = false;

  @Input()
  set open(v: boolean) {
    this._open = !!v;

    if (this._open && this.auth.user()) {
      this.loadBudgets();
    }

    if (!this._open) {
      this.isInitializerOpen.set(false); 
    }

  }
  get open() {
    return this._open;
  }

  budgets = signal<BudgetRow[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  isInitializerOpen = signal<boolean>(false);

  constructor(
    public auth: AuthService,
    private budgetService: BudgetService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  onClose() {
    this.close.emit();
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

  goToBudget(budgetId: number) {
    this.router.navigate(['/budgets', budgetId]);
    this.onClose();
  }

  openInitializer() {
    const dialogRef = this.dialog.open(BudgetInitializer, {
    disableClose: false
  });

    dialogRef.afterClosed().subscribe((success) => {
      if (success) this.onClose();
    });
  }

}
