import { Component, Input, signal, WritableSignal } from '@angular/core';
import { BudgetRow, BudgetService } from '../../../services/budget-service';


@Component({
  selector: 'app-overview-card',
  imports: [],
  templateUrl: './overview.html',
  styleUrl: '../cards-common.scss',
})
export class Overview {
  @Input({ required: true })
  budget!: WritableSignal<BudgetRow | null>;
  error = signal<string>('');


  constructor(private budgetSerive:BudgetService){}

  async deleteBudget(){
    const budgetValue = this.budget();
    if (budgetValue) {
      await this.budgetSerive.deleteBudget({name: budgetValue.name})
    }
  }

  getMyRoleLabel(): string {
    const b: any = this.budget();
    return b?.type || 'contributor';
  }
}
