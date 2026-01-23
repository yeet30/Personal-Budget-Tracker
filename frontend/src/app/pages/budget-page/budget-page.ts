import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetService, BudgetRow } from '../../services/budget-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-page.html',
  styleUrl: './budget-page.scss',
})
export class BudgetPage implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  budget = signal<(BudgetRow & { created_at?: string }) | null>(null);
  inviteIdentifier = '';
  inviteError = '';
  inviteSuccess = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetService: BudgetService,
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(async (pm) => {
      const id = Number(pm.get('id'));

      this.loading.set(true);
      this.error.set(null);
      this.budget.set(null);

      if (!Number.isFinite(id)) {
        this.error.set('Invalid budget id.');
        this.loading.set(false);
        return;
      }

      try {
        const res: any = await this.budgetService.getBudget(id);
        this.budget.set(res?.budget ?? null);

        if (!res?.budget) {
          this.error.set('Budget not found.');
        }
      } catch (e: any) {
        this.error.set(e?.error?.message ?? 'Failed to load budget.');
      } finally {
        this.loading.set(false);
      }
    });
  }

  backToHome() {
    this.router.navigate(['/home']);
  }
  getMyRoleLabel(): string {
    const b: any = this.budget();
    return b?.type || 'contributor';
  }
  async inviteUser() {
    this.inviteError = '';
    this.inviteSuccess = '';

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    try {
      await this.budgetService.addUserToBudget(id, this.inviteIdentifier);
      this.inviteSuccess = 'User added!';
      this.inviteIdentifier = '';
    } catch (e: any) {
      this.inviteError = e?.error?.message ?? 'Failed to add user.';
    }
  }
}
