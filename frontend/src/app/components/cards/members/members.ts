import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetRow } from '../../../services/budget-service';
import { BudgetService } from '../../../services/budget-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-members-card',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './members.html',
  styleUrl: '../cards-common.scss',
})
export class Members {
  inviteError = '';
  inviteSuccess = '';
  inviteIdentifier ='';

  @Input({ required: true })
  members: any = [];
  @Input({ required: true })
  membersError!: () => string | null;
  @Input({ required: true })
  budget!: () => BudgetRow | null;
  @Input({ required: true })
  routeId: number = 0;

  constructor(private budgetService: BudgetService){}

  async inviteUser() {
    this.inviteError = '';
    this.inviteSuccess = '';

    try {
      await this.budgetService.addUserToBudget(this.routeId, this.inviteIdentifier);
      this.inviteSuccess = 'User added!';
    } catch (e: any) {
      this.inviteError = e?.error?.message ?? 'Failed to add user.';
    }
  }


  

}
