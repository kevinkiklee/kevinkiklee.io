import type { Heading, Root } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkHeadingIncrement() {
  return (tree: Root, file: { fail: (msg: string) => never }) => {
    let prev = 1;
    visit(tree, 'heading', (node: Heading) => {
      if (node.depth > prev + 1) {
        file.fail(`heading hierarchy skipped from h${prev} to h${node.depth}`);
      }
      prev = node.depth;
    });
  };
}
