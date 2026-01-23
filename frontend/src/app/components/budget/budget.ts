import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type CreateBudgetPayload = {
  name: string;
  currency: string;
  start_date: string;
  end_date: string;
};

@Component({
  selector: 'app-create-budget-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.scss',
})
export class BudgetModal {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() submitBudget = new EventEmitter<CreateBudgetPayload>();

  name = signal('');
  currency = signal('EUR');
  start_date = signal('');
  end_date = signal('');

  fieldErrors = signal<Partial<Record<keyof CreateBudgetPayload, string>>>({});
  backendError = signal<string | null>(null);

  onClose() {
    this.backendError.set(null);
    this.fieldErrors.set({});
    this.close.emit();
  }

  clearField(field: keyof CreateBudgetPayload) {
    const curr = this.fieldErrors();
    this.fieldErrors.set({ ...curr, [field]: undefined });
    this.backendError.set(null);
  }

  submit() {
    this.backendError.set(null);
    this.fieldErrors.set({});

    const payload: CreateBudgetPayload = {
      name: this.name().trim(),
      currency: this.currency().trim().toUpperCase(),
      start_date: this.start_date().trim(),
      end_date: this.end_date().trim(),
    };

    const errors: any = {};
    if (!payload.name) errors.name = 'Budget name is required.';
    if (payload.name.length > 50) errors.name = 'Budget name must be <= 50 characters.';
    if (!/^[A-Z]{3}$/.test(payload.currency)) errors.currency = 'Currency must be like EUR.';
    if (!payload.start_date) errors.start_date = 'Start date is required.';
    if (!payload.end_date) errors.end_date = 'End date is required.';
    if (payload.start_date && payload.end_date && payload.start_date > payload.end_date) {
      errors.end_date = 'End date must be after start date.';
    }

    if (Object.keys(errors).length) {
      this.fieldErrors.set(errors);
      return;
    }

    this.submitBudget.emit(payload);
  }

  setBackendError(msg: string | null) {
    this.backendError.set(msg);
  }

  resetForm() {
    this.name.set('');
    this.currency.set('EUR');
    this.start_date.set('');
    this.end_date.set('');
    this.fieldErrors.set({});
    this.backendError.set(null);
  }
}
