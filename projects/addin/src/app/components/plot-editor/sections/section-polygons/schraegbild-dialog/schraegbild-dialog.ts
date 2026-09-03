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
import { UnitsPerSquare } from '../../../../../models/plot';

export type SchraegbildDirection =
  'right-up' | 'right-down' | 'left-up' | 'left-down';

export interface SchraegbildData {
  polygonTitle: string;
}

export interface SchraegbildResult {
  depthInSquares: number;
  direction: SchraegbildDirection;
}

export const SCHRAEGBILD_MIN_DEPTH_IN_SQUARES = 1;
export const SCHRAEGBILD_MAX_DEPTH_IN_SQUARES = 10;
export const SCHRAEGBILD_STEP_IN_SQUARES = 1;
export const SCHRAEGBILD_DEFAULT_DEPTH_IN_SQUARES = 2;
export const SCHRAEGBILD_DEFAULT_DIRECTION: SchraegbildDirection = 'right-up';

export function schraegbildDirectionToOffset(
  direction: SchraegbildDirection,
  depthInSquares: number,
  unitsPerSquare: UnitsPerSquare,
): { x: number; y: number } {
  const xSign = direction === 'right-up' || direction === 'right-down' ? 1 : -1;
  const ySign = direction === 'right-up' || direction === 'left-up' ? 1 : -1;
  return {
    x: xSign * depthInSquares * unitsPerSquare.x,
    y: ySign * depthInSquares * unitsPerSquare.y,
  };
}

interface SchraegbildFormValue {
  depthInSquares: number;
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

  protected readonly step = SCHRAEGBILD_STEP_IN_SQUARES;

  protected readonly directionOptions: PillSwitchOption<SchraegbildDirection>[][] =
    [
      [
        { value: 'right-up', label: 'Rechts/oben' },
        { value: 'right-down', label: 'Rechts/unten' },
      ],
      [
        { value: 'left-up', label: 'Links/oben' },
        { value: 'left-down', label: 'Links/unten' },
      ],
    ];

  private readonly state = signal<SchraegbildFormValue>({
    depthInSquares: SCHRAEGBILD_DEFAULT_DEPTH_IN_SQUARES,
    direction: SCHRAEGBILD_DEFAULT_DIRECTION,
  });

  protected readonly schraegbildForm = form<SchraegbildFormValue>(
    this.state,
    schema => {
      min(schema.depthInSquares, SCHRAEGBILD_MIN_DEPTH_IN_SQUARES, {
        message: `Tiefe muss mindestens ${SCHRAEGBILD_MIN_DEPTH_IN_SQUARES} Kästchen sein.`,
      });
      max(schema.depthInSquares, SCHRAEGBILD_MAX_DEPTH_IN_SQUARES, {
        message: `Tiefe darf höchstens ${SCHRAEGBILD_MAX_DEPTH_IN_SQUARES} Kästchen sein.`,
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
      depthInSquares: value.depthInSquares,
      direction: value.direction,
    });
  }
}
