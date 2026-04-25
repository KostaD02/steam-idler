import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/nest';

import { NestLibraryGeneratorSchema } from './schema';
import { removeDefaultFiles } from './util';

interface NormalizedSchema extends NestLibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  parsedTags: string[];
  fileName: string;
  className: string;
  importPath: string;
}

function normalizeOptions(
  tree: Tree,
  options: NestLibraryGeneratorSchema,
): NormalizedSchema {
  const libraryNames = names(options.name);
  const libraryType = options.type;

  const projectRoot = options.directory
    ? joinPathFragments(
        'libs',
        options.directory,
        libraryNames.fileName,
        libraryType,
      )
    : joinPathFragments('libs', libraryNames.fileName, libraryType);

  // Project name uses dashes instead of slashes (e.g., server-feature-auth)
  const projectName = projectRoot.replace('libs/', '').replace(/\//g, '-');

  const defaultTags = [`type:${options.type}`];
  if (options.directory) {
    defaultTags.push(`scope:${options.directory}`);
  }
  const userTags = options.tags
    ? options.tags.split(',').map((tag) => tag.trim())
    : [];
  const parsedTags = [...defaultTags, ...userTags];

  const importPathSuffix = options.directory
    ? `${options.name}/${libraryType}`
    : libraryType;
  const importPath =
    options.importPath || `@steam-idler/server/${importPathSuffix}`;

  return {
    ...options,
    projectName,
    projectRoot,
    parsedTags,
    fileName: libraryNames.fileName,
    className: libraryNames.className,
    importPath,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema): void {
  const templateOptions = {
    ...options,
    ...names(options.name),
    template: '',
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/common'),
    options.projectRoot,
    templateOptions,
  );

  generateFiles(
    tree,
    joinPathFragments(__dirname, `./files/${options.type}`),
    options.projectRoot,
    templateOptions,
  );
}

function updateTsConfigPaths(tree: Tree, options: NormalizedSchema): void {
  updateJson(tree, 'tsconfig.base.json', (json) => {
    const paths = json.compilerOptions?.paths || {};
    paths[options.importPath] = [`${options.projectRoot}/src/index.ts`];
    json.compilerOptions = json.compilerOptions || {};
    json.compilerOptions.paths = paths;
    return json;
  });
}

export default async function (
  tree: Tree,
  options: NestLibraryGeneratorSchema,
): Promise<void> {
  const normalizedOptions = normalizeOptions(tree, options);

  await libraryGenerator(tree, {
    directory: normalizedOptions.projectRoot,
    name: normalizedOptions.projectName,
    tags: normalizedOptions.parsedTags.join(','),
    buildable: options.buildable,
    publishable: options.publishable,
    importPath: normalizedOptions.importPath,
    skipFormat: true,
    strict: true,
    unitTestRunner: 'jest',
    linter: 'eslint',
    useProjectJson: true,
  });

  const projectConfig = readProjectConfiguration(
    tree,
    normalizedOptions.projectName,
  );

  removeDefaultFiles(tree, projectConfig.root);

  addFiles(tree, { ...normalizedOptions, projectRoot: projectConfig.root });

  updateTsConfigPaths(tree, {
    ...normalizedOptions,
    projectRoot: projectConfig.root,
  });

  projectConfig.targets.lint = {
    executor: '@nx/eslint:lint',
    options: {
      lintFilePatterns: [`${projectConfig.root}/**/*.ts`],
    },
  };

  updateProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    projectConfig,
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}
