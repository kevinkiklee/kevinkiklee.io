import type { Heading, Node, Root } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkHeadingIncrement() {
  return (tree: Root, file: { fail: (msg: string, node?: Node) => never }) => {
    let prev = 1;
    visit(tree, 'heading', (node: Heading) => {
      if (node.depth > prev + 1) {
        file.fail(`heading hierarchy skipped from h${prev} to h${node.depth}`, node);
      }
      prev = node.depth;
    });
  };
}
