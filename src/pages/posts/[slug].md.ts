import type { CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { formatDate } from '~/lib/format';
import { mdxToMarkdown } from '~/lib/mdx-to-md';
import { getPublishedPosts } from '~/lib/posts';
import { SITE } from '~/lib/site-config';

type Post = CollectionEntry<'posts'>;

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export async function renderPostMarkdown(post: Post): Promise<string> {
  const body = await mdxToMarkdown(post.body ?? '');
  const fm = [
    '---',
    `title: ${post.data.title}`,
    `date: ${formatDate(post.data.pubDate)}`,
    ...(post.data.updatedDate ? [`updatedDate: ${formatDate(post.data.updatedDate)}`] : []),
    `tags: [${post.data.tags.join(', ')}]`,
    `description: ${post.data.description}`,
    `url: ${SITE.url}/posts/${post.id}`,
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
