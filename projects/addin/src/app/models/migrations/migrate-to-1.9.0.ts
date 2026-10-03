import { Migration } from '../migration';

export const migrateTo190: Migration = {
  version: '1.9.0',
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    return {
      ...plot,
      unitsPerSquare: plot['unitsPerSquare'] ?? { x: 0.5, y: 0.5 },
      axisSnapping: plot['axisSnapping'] ?? { x: 'extend', y: 'extend' },
    };
  },
};
