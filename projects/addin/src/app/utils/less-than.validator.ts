import { SchemaPath, validate } from '@angular/forms/signals';

export const lessThanValidator = (
  fieldA: SchemaPath<number>,
  fieldB: SchemaPath<number>,
  message: string,
): void => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  validate(fieldA, ({ value, valueOf }) => {
    const fieldAValue = value();
    const fieldBValue = valueOf(fieldB);

    if (fieldAValue >= fieldBValue) {
      return {
        field: fieldA,
        message,
        kind: 'lessThan',
      };
    }

    return null;
  });
};
