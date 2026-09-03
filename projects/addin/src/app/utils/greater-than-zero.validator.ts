import { SchemaPath, validate } from '@angular/forms/signals';

export const greaterThanZeroValidator = (
  field: SchemaPath<number>,
  message: string,
): void => {
  validate(field, ({ value }) => {
    const fieldValue = value();

    if (!Number.isFinite(fieldValue) || fieldValue <= 0) {
      return {
        field,
        message,
        kind: 'greaterThanZero',
      };
    }

    return null;
  });
};
