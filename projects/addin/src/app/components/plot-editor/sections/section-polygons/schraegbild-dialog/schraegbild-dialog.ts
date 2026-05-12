import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { form, FormField, max, min } from '@angular/forms/signals';
import { ButtonDirective } from '../../../../../ui/button/button.directive';
import { Input } from '../../../../../ui/input/input';
import {
  PillSwitch,
  PillSwitchOption,
} from '../../../../pill-switch/pill-switch';

export type SchraegbildDirection =
  | 'right-up'
  | 'right-down'
  | 'left-up'
  | 'left-down';

export interface SchraegbildData {
  polygonTitle: string;
}

export interface SchraegbildResult {
  depth: number;
  direction: SchraegbildDirection;
}

export const SCHRAEGBILD_MIN_DEPTH = 0.5;
export const SCHRAEGBILD_MAX_DEPTH = 5;
export const SCHRAEGBILD_STEP = 0.5;
export const SCHRAEGBILD_DEFAULT_DEPTH = 0.5;
export const SCHRAEGBILD_DEFAULT_DIRECTION: SchraegbildDirection = 'right-up';

export function schraegbildDirectionToOffset(
  direction: SchraegbildDirection,
  depth: number,
): { x: number; y: number } {
  const xSign = direction === 'right-up' || direction === 'right-down' ? 1 : -1;
  const ySign = direction === 'right-up' || direction === 'left-up' ? 1 : -1;
  return { x: xSign * depth, y: ySign * depth };
}

interface SchraegbildFormValue {
  depth: number;
  direction: SchraegbildDirection;
}

@Component({
  selector: 'lg-schraegbild-dialog',
  imports: [ButtonDirective, FormField, Input, PillSwitch],
  templateUrl: './schraegbild-dialog.html',
  styleUrl: './schraegbild-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchraegbildDialog {
  protected readonly data = inject<SchraegbildData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<SchraegbildResult>>(DialogRef);

  protected readonly step = SCHRAEGBILD_STEP;

  protected readonly directionOptions: PillSwitchOption<SchraegbildDirection>[] =
    [
      { value: 'right-up', label: 'Rechts/oben' },
      { value: 'right-down', label: 'Rechts/unten' },
      { value: 'left-up', label: 'Links/oben' },
      { value: 'left-down', label: 'Links/unten' },
    ];

  private readonly state = signal<SchraegbildFormValue>({
    depth: SCHRAEGBILD_DEFAULT_DEPTH,
    direction: SCHRAEGBILD_DEFAULT_DIRECTION,
  });

  protected readonly schraegbildForm = form<SchraegbildFormValue>(
    this.state,
    schema => {
      min(schema.depth, SCHRAEGBILD_MIN_DEPTH, {
        message: `Tiefe muss mindestens ${SCHRAEGBILD_MIN_DEPTH} sein.`,
      });
      max(schema.depth, SCHRAEGBILD_MAX_DEPTH, {
        message: `Tiefe darf höchstens ${SCHRAEGBILD_MAX_DEPTH} sein.`,
      });
    },
  );

  protected readonly hasErrors = computed(
    () => this.schraegbildForm().errorSummary().length > 0,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    if (this.hasErrors()) {
      return;
    }
    const value = this.state();
    this.dialogRef.close({
      depth: value.depth,
      direction: value.direction,
    });
  }
}
