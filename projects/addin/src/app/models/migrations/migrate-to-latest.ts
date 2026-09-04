import { Migration } from '../migration';

export const migrateToLatest: Migration = {
  version: 'latest',
  migrate: (plot: Record<string, unknown>): Record<string, unknown> => {
    return {
      ...plot,
      unitsPerSquare: plot['unitsPerSquare'] ?? { x: 0.5, y: 0.5 },
      squareRounding: plot['squareRounding'] ?? { x: 'up', y: 'up' },
    };
  },
};
