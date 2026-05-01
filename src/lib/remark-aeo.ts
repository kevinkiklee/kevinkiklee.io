import type { Heading, Paragraph, Root } from 'mdast';
import type { VFile } from 'vfile';

interface RemarkPluginFile extends VFile {
  data: {
    astro?: { frontmatter?: { title?: string; description?: string } };
  };
}

/**
 * Astro/remark plugin enforcing AEO conventions on MDX posts.
 *
 * Behavior (Tasks 11–14 add to this):
 * - Locates the h1, finds the first paragraph after it (skipping image/
 *   figure/blockquote leaders), attaches `className="lead"` to it.
 * - Fails the build with a descriptive Error when an MDX post lacks a
 *   TL;DR, h2 outline, or correct image attributes; or when frontmatter
 *   title/description exceed configured limits.
 */
export function remarkAeo() {
  return function transform(tree: Root, file: RemarkPluginFile) {
    const filePath = file.path ?? '<unknown>';

    const h1Index = tree.children.findIndex(
      (n) => n.type === 'heading' && (n as Heading).depth === 1,
    );
    if (h1Index === -1) {
      throw new Error(`[remark-aeo] no <h1> in ${filePath}`);
    }

    const isSkippable = (n: { type: string }) =>
      n.type === 'image' ||
      n.type === 'thematicBreak' ||
      n.type === 'blockquote' ||
      (n.type === 'paragraph' && isOnlyImage(n as Paragraph));

    let leadIndex = -1;
    for (let i = h1Index + 1; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (!node) continue;
      if (isSkippable(node)) continue;
      if (node.type === 'paragraph') {
        leadIndex = i;
        break;
      }
      break;
    }
    if (leadIndex === -1) {
      throw new Error(`[remark-aeo] no TL;DR paragraph after <h1> in ${filePath}`);
    }

    const lead = tree.children[leadIndex] as Paragraph & {
      data?: { hProperties?: { className?: string[] } };
    };
    if (!lead.data) lead.data = {};
    if (!lead.data.hProperties) lead.data.hProperties = {};
    const cls = lead.data.hProperties.className ?? [];
    if (!cls.includes('lead')) cls.push('lead');
    lead.data.hProperties.className = cls;

    const hasH2 = tree.children.some((n) => n.type === 'heading' && (n as Heading).depth === 2);
    if (!hasH2) {
      throw new Error(`[remark-aeo] no <h2> in ${filePath} — outline required for AEO`);
    }
  };
}

function isOnlyImage(p: Paragraph): boolean {
  if (p.children.length !== 1) return false;
  const only = p.children[0];
  return only?.type === 'image';
}
