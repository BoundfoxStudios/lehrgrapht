import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Plot } from '../../../../models/plot';
import { Dropdown } from '../../../dropdown/dropdown';
import { legendLabelFormatOptions } from '../../dropdown-options';

@Component({
  selector: 'lg-section-settings',
  imports: [FormField, Dropdown],
  templateUrl: './section-settings.html',
  styleUrl: './section-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSettings {
  protected readonly legendLabelFormatOptions = legendLabelFormatOptions;

  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly editorModel = input.required<Plot>();
}
