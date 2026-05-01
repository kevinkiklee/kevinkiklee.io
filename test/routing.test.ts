import { describe, expect, it } from 'vitest';
import { getPublishedPosts } from '../src/lib/posts';
import { getStaticPaths as mdPaths } from '../src/pages/posts/[slug].md';

describe('post route parity', () => {
  it('[slug].md.ts paths match published-post slugs', async () => {
    const mds = await mdPaths();
    const posts = await getPublishedPosts();
    const mdSlugs = mds.map((p) => p.params.slug).sort();
    const postSlugs = posts.map((p) => p.id).sort();
    expect(mdSlugs).toEqual(postSlugs);
  });
});
