import type { CollectionEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { stringify as yamlStringify } from 'yaml';
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
  // Build frontmatter through yaml.stringify so a title containing a colon
  // (`Field notes: foo`) or other YAML-significant characters can't corrupt
  // the emitted document. The previous string-concat approach would silently
  // produce invalid YAML — visible only to downstream consumers (LLM crawlers,
  // markdown viewers) that try to parse the front matter.
  const fmObj: Record<string, unknown> = {
    title: post.data.title,
    date: formatDate(post.data.pubDate),
  };
  if (post.data.updatedDate) fmObj.updatedDate = formatDate(post.data.updatedDate);
  fmObj.tags = post.data.tags;
  fmObj.description = post.data.description;
  fmObj.url = `${SITE.url}/posts/${post.id}`;
  const fm = `---\n${yamlStringify(fmObj)}---\n\n`;
  return fm + body;
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: Post }).post;
  const body = await renderPostMarkdown(post);
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
