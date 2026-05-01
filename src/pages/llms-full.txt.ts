import type { APIRoute } from 'astro';
import { buildLlmsFull } from '~/lib/aeo';
import { getPublishedPosts } from '~/lib/posts';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const body = buildLlmsFull(posts);
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
