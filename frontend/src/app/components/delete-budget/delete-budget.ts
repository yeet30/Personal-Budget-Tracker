import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-budget',
  imports: [],
  templateUrl: './delete-budget.html',
  styleUrl: './delete-budget.scss',
})
export class DeleteBudget {

  constructor(
    private dialogRef: MatDialogRef<DeleteBudget>
  ){}

  closeWindow(decision:boolean) {
    this.dialogRef.close(decision);
  }
}