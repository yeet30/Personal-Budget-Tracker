import { Component, Input, ChangeDetectorRef, signal, WritableSignal } from '@angular/core';
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
  budget!: WritableSignal<BudgetRow | null>;
  @Input({ required: true })
  routeId: number = 0;

  constructor(private budgetService: BudgetService, private cdr: ChangeDetectorRef){}

  async inviteUser() {
    this.inviteError = '';
    this.inviteSuccess = '';

    try {
      await this.budgetService.addUserToBudget(this.routeId, this.inviteIdentifier);
      this.inviteSuccess = 'Invite sent!';
      this.cdr.detectChanges();
    } catch (e: any) {
      this.inviteError = e?.error?.message ?? 'Failed to send invite.';
      this.cdr.detectChanges();
    }
  }


  

}
