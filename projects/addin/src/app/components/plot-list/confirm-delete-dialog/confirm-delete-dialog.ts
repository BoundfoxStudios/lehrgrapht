import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonDirective } from '../../../ui/button/button.directive';

export interface ConfirmDeleteData {
  plotName: string;
}

export type ConfirmDeleteResult = 'confirm';

@Component({
  selector: 'lg-confirm-delete-dialog',
  imports: [ButtonDirective],
  templateUrl: './confirm-delete-dialog.html',
  styleUrl: './confirm-delete-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialog {
  protected readonly data = inject<ConfirmDeleteData>(DIALOG_DATA);
  private readonly dialogRef =
    inject<DialogRef<ConfirmDeleteResult>>(DialogRef);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }
}
