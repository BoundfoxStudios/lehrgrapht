import { Injectable } from '@angular/core';

const idKeyPrefix = 'lehrgrapht-';

@Injectable({ providedIn: 'root' })
export class DocumentStorageService {
  async set(id: string, model: unknown): Promise<void> {
    await Word.run(async context => {
      context.document.settings.add(this.createKey(id), model);
      await context.sync();
    });
  }

  get<T>(id: string): Promise<T | undefined> {
    return Word.run(async context => {
      const itemOrNull = context.document.settings.getItemOrNullObject(
        this.createKey(id),
      );
      itemOrNull.load();
      await context.sync();

      if (itemOrNull.isNullObject) {
        return Promise.resolve(undefined);
      }

      return Promise.resolve(itemOrNull.value as T);
    });
  }

  remove(id: string): Promise<void> {
    return Word.run(async context => {
      const itemOrNull = context.document.settings.getItemOrNullObject(
        this.createKey(id),
      );
      itemOrNull.load();
      await context.sync();

      if (itemOrNull.isNullObject) {
        return;
      }

      itemOrNull.delete();
      await context.sync();
    });
  }

  list(prefix?: string): Promise<{ key: string; value: unknown }[]> {
    return Word.run(async context => {
      const settings = context.document.settings.load();
      await context.sync();

      prefix = prefix ? this.createKey(prefix) : '';

      return settings.items
        .filter(item => item.key.startsWith(prefix ?? ''))
        .map(item => ({
          key: item.key,
          value: item.value as unknown,
        }));
    });
  }

  private createKey(id: string): string {
    return `${idKeyPrefix}${id}`;
  }
}
