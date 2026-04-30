/**
 * Vitest stub for `astro:content`. Replaced by the alias in vitest.config.ts
 * so unit tests of modules that import `getCollection` / `CollectionEntry`
 * don't fail at module-load. Tests that exercise getCollection should mock
 * it explicitly with `vi.mock('astro:content', ...)`.
 */
type Filter<T> = (item: T) => boolean;

export async function getCollection<T = unknown>(_name: string, _filter?: Filter<T>): Promise<T[]> {
  return [];
}

export type CollectionEntry<_T extends string> = {
  id: string;
  data: Record<string, unknown>;
};
