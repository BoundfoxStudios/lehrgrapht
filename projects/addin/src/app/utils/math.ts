import { all, Complex, create } from 'mathjs';

export const math = create(all);

const ln = Object.assign(
  math.typed('ln', {
    'number | Complex': (value: number | Complex): number | Complex =>
      math.log(value),
  }),
  { toTex: { 1: '\\ln\\left(${args[0]}\\right)' } },
);

const lg = Object.assign(
  math.typed('lg', {
    'number | Complex': (value: number | Complex): number | Complex =>
      math.log10(value),
  }),
  { toTex: { 1: '\\lg\\left(${args[0]}\\right)' } },
);

math.import({ ln, lg });
