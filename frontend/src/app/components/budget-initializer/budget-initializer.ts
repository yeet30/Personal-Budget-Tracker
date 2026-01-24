import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { BudgetService } from '../../services/budget-service';

@Component({
  selector: 'app-budget-initializer',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
  ],
  templateUrl: './budget-initializer.html',
  styleUrl: './budget-initializer.scss',
})
export class BudgetInitializer {

  constructor(
    private budgetService: BudgetService,
    private router: Router,
    private dialogRef: MatDialogRef<BudgetInitializer>
  ){}

  closeInitializer() {
    this.clearInitializerMessages();
    this.initializerErrors.set({});
    this.dialogRef.close();
  }

  initializerForm = signal<{
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

  initializerErrors = signal<Partial<Record<'name' | 'currency' | 'start_date' | 'end_date', string>>>(
    {},
  );
  initializerBackendError = signal<string | null>(null);


  clearInitializerMessages() {
    this.initializerBackendError.set(null);
  }
  
  patchInitializerForm(
    patch: Partial<{ name: string; currency: string; start_date: string; end_date: string }>,
  ) {
    this.clearInitializerMessages();
    this.initializerErrors.set({});
    this.initializerForm.set({ ...this.initializerForm(), ...patch });
  }

  async submitInitializer() {
    this.clearInitializerMessages();
    this.initializerErrors.set({});

    const payload = this.initializerForm();

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
      this.initializerErrors.set(errors);
      return;
    }
    
    try {
      const res: any = await this.budgetService.createBudget({
        name: payload.name.trim(),
        currency: payload.currency.trim().toUpperCase(),
        start_date: payload.start_date,
        end_date: payload.end_date,
      });

      this.closeInitializer();

      const createdId = res?.budget?.budget_id;
      if (createdId) {
        this.router.navigate(['/budgets', createdId]);
      }
    } catch (e: any) {
      const apiErrors = e?.error?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        this.initializerErrors.set({
          name: apiErrors.name,
          currency: apiErrors.currency,
          start_date: apiErrors.start_date,
          end_date: apiErrors.end_date,
        });
      }
      this.initializerBackendError.set(e?.error?.message ?? 'Failed to create budget.');
    }
    
  }
    
}
