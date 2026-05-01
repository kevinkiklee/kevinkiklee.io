import type { CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { mdxToMarkdown } from '~/lib/mdx-to-md';
import { getPublishedPosts } from '~/lib/posts';

type Post = CollectionEntry<'posts'>;

const SITE = 'https://kevinkiklee.io';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export async function renderPostMarkdown(post: Post): Promise<string> {
  const body = await mdxToMarkdown(post.body ?? '');
  const fm = [
    '---',
    `title: ${post.data.title}`,
    `date: ${post.data.pubDate.toISOString().slice(0, 10)}`,
    ...(post.data.updatedDate
      ? [`updatedDate: ${post.data.updatedDate.toISOString().slice(0, 10)}`]
      : []),
    `tags: [${post.data.tags.join(', ')}]`,
    `description: ${post.data.description}`,
    `url: ${SITE}/posts/${post.id}`,
    '---',
    '',
  ].join('\n');
  return fm + body;
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: Post }).post;
  const body = await renderPostMarkdown(post);
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
