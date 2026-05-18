import { joinPathFragments, Tree } from '@nx/devkit';

export function deleteRecursively(tree: Tree, path: string): void {
  if (!tree.exists(path)) {
    return;
  }

  if (tree.isFile(path)) {
    tree.delete(path);
    return;
  }

  const children = tree.children(path);
  for (const child of children) {
    deleteRecursively(tree, joinPathFragments(path, child));
  }
}

export function removeDefaultFiles(tree: Tree, projectRoot: string): void {
  const pathsToRemove = [
    `${projectRoot}/src/index.ts`,
    `${projectRoot}/src/lib`,
    `${projectRoot}/src/test-setup.ts`,
  ];

  for (const path of pathsToRemove) {
    deleteRecursively(tree, path);
  }
}
