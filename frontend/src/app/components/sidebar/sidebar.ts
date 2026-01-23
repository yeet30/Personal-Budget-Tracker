import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth-service';
import { BudgetService } from '../../services/budget-service';

export type BudgetRow = {
  budget_id: number;
  name: string;
  currency: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  type: 'OWNER' | 'CONTRIBUTOR';
};

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
      this.isCreateOpen.set(false);
      this.clearCreateMessages();
    }
  }
  get open() {
    return this._open;
  }

  budgets = signal<BudgetRow[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  isCreateOpen = signal<boolean>(false);

  createForm = signal<{
    name: string;
    currency: string;
    start_date: string;
    end_date: string;
  }>({
    name: '',
    currency: 'EUR',
    start_date: '',
    end_date: '',
  });

  createErrors = signal<Partial<Record<'name' | 'currency' | 'start_date' | 'end_date', string>>>(
    {},
  );
  createBackendError = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    private budgetService: BudgetService,
    private router: Router,
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

  openCreate() {
    this.isCreateOpen.set(true);
    this.clearCreateMessages();
    this.createErrors.set({});
  }

  closeCreate() {
    this.isCreateOpen.set(false);
    this.clearCreateMessages();
    this.createErrors.set({});
  }

  clearCreateMessages() {
    this.createBackendError.set(null);
  }

  patchCreateForm(
    patch: Partial<{ name: string; currency: string; start_date: string; end_date: string }>,
  ) {
    this.clearCreateMessages();
    this.createErrors.set({});
    this.createForm.set({ ...this.createForm(), ...patch });
  }

  async submitCreate() {
    this.clearCreateMessages();
    this.createErrors.set({});

    const payload = this.createForm();

    const errors: Partial<Record<'name' | 'currency' | 'start_date' | 'end_date', string>> = {};

    if (!payload.name?.trim()) errors.name = 'Budget name is required.';
    if (!payload.currency?.trim()) errors.currency = 'Currency is required.';
    if (!payload.start_date?.trim()) errors.start_date = 'Start date is required.';
    if (!payload.end_date?.trim()) errors.end_date = 'End date is required.';

    if (payload.currency && !/^[A-Za-z]{3}$/.test(payload.currency.trim())) {
      errors.currency = 'Currency must be a 3-letter code (e.g. EUR).';
    }

    if (payload.start_date && payload.end_date && payload.start_date > payload.end_date) {
      errors.end_date = 'End date must be after start date.';
    }

    if (Object.keys(errors).length > 0) {
      this.createErrors.set(errors);
      return;
    }

    try {
      const res: any = await this.budgetService.createBudget({
        name: payload.name.trim(),
        currency: payload.currency.trim().toUpperCase(),
        start_date: payload.start_date,
        end_date: payload.end_date,
      });

      await this.loadBudgets();
      this.closeCreate();

      const createdId = res?.budget?.budget_id;
      if (createdId) {
        this.router.navigate(['/budgets', createdId]);
        this.onClose();
      }
    } catch (e: any) {
      const apiErrors = e?.error?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        this.createErrors.set({
          name: apiErrors.name,
          currency: apiErrors.currency,
          start_date: apiErrors.start_date,
          end_date: apiErrors.end_date,
        });
      }
      this.createBackendError.set(e?.error?.message ?? 'Failed to create budget.');
    }
  }

  goToBudget(budgetId: number) {
    this.router.navigate(['/budgets', budgetId]);
    this.onClose();
  }
}
