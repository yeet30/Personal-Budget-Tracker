import { Component, Input, signal  } from '@angular/core';
import { BudgetRow, BudgetService } from '../../../services/budget-service';


@Component({
  selector: 'app-overview-card',
  imports: [],
  templateUrl: './overview.html',
  styleUrl: '../cards-common.scss',
})
export class Overview {
  @Input({ required: true })
  budget!: () => BudgetRow;
  error = signal<string>('');


  constructor(private budgetSerive:BudgetService){}

  async deleteBudget(){
    await this.budgetSerive.deleteBudget({name: this.budget().name})
  }

  getMyRoleLabel(): string {
    const b: any = this.budget();
    return b?.type || 'contributor';
  }
}
