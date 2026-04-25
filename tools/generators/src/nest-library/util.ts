import { joinPathFragments, Tree } from '@nx/devkit';

export function deleteRecursively(tree: Tree, path: string): void {
  if (!tree.exists(path)) {
    return;
  }

  if (tree.isFile(path)) {
    tree.delete(path);
    return;
  }

  // It's a directory - recursively delete children first
  const children = tree.children(path);
  for (const child of children) {
    deleteRecursively(tree, joinPathFragments(path, child));
  }
}

export function removeDefaultFiles(tree: Tree, projectRoot: string): void {
  const pathsToRemove = [
    `${projectRoot}/src/index.ts`,
    `${projectRoot}/src/lib`,
  ];

  for (const path of pathsToRemove) {
    deleteRecursively(tree, path);
  }
}
