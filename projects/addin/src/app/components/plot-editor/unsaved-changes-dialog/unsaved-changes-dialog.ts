import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  Signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleExclamation,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { ButtonDirective } from '../../../ui/button/button.directive';

export interface UnsavedChangesData {
  hasErrors: Signal<boolean>;
  errorCount: Signal<number>;
  save: () => Promise<boolean>;
}

export type UnsavedChangesResult = 'discard' | 'save';

@Component({
  selector: 'lg-unsaved-changes-dialog',
  imports: [FaIconComponent, ButtonDirective],
  templateUrl: './unsaved-changes-dialog.html',
  styleUrl: './unsaved-changes-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsavedChangesDialog {
  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faCircleNotch = faCircleNotch;

  protected readonly data = inject<UnsavedChangesData>(DIALOG_DATA);
  private readonly dialogRef =
    inject<DialogRef<UnsavedChangesResult>>(DialogRef);

  protected readonly isSaving = signal(false);
  protected readonly saveFailed = signal(false);

  protected discard(): void {
    this.dialogRef.close('discard');
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(): Promise<void> {
    if (this.data.hasErrors() || this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    this.saveFailed.set(false);
    const ok = await this.data.save();
    this.isSaving.set(false);
    if (ok) {
      this.dialogRef.close('save');
    } else {
      this.saveFailed.set(true);
    }
  }
}
