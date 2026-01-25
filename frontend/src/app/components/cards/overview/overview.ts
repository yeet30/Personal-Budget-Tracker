import { Component, Input  } from '@angular/core';
import { BudgetRow } from '../../../services/budget-service';

@Component({
  selector: 'app-overview-card',
  imports: [],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview {
  @Input({ required: true })
  budget!: () => BudgetRow | null;

  getMyRoleLabel(): string {
    const b: any = this.budget();
    return b?.type || 'contributor';
  }
}
