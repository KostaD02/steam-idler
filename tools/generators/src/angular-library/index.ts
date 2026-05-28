import { libraryGenerator } from '@nx/angular/generators';
import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';

import { AngularLibraryGeneratorSchema } from './schema';
import { removeDefaultFiles } from './util';

interface NormalizedSchema extends AngularLibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  parsedTags: string[];
  fileName: string;
  className: string;
  propertyName: string;
  constantName: string;
  importPath: string;
  prefix: string;
  directory: string;
  typeFolder: string;
}

function normalizeOptions(
  tree: Tree,
  options: AngularLibraryGeneratorSchema,
): NormalizedSchema {
  const directory = options.directory ?? 'client';
  const prefix = options.prefix ?? 'si';

  const domainNames = names(options.name);
  const subNames = options.subname ? names(options.subname) : null;

  const typeFolder = subNames
    ? `${options.type}-${subNames.fileName}`
    : options.type;

  const projectRoot = joinPathFragments(
    'libs',
    directory,
    domainNames.fileName,
    typeFolder,
  );

  const projectName = projectRoot.replace('libs/', '').replace(/\//g, '-');

  const entityNames = subNames ?? domainNames;

  const defaultTags = [`type:${options.type}`, `scope:${directory}`];
  const userTags = options.tags
    ? options.tags.split(',').map((tag) => tag.trim())
    : [];
  const parsedTags = [...defaultTags, ...userTags];

  const importPath =
    options.importPath ||
    `@steam-idler/${directory}/${domainNames.fileName}/${typeFolder}`;

  return {
    ...options,
    directory,
    typeFolder,
    projectName,
    projectRoot,
    parsedTags,
    fileName: entityNames.fileName,
    className: entityNames.className,
    propertyName: entityNames.propertyName,
    constantName: entityNames.constantName,
    importPath,
    prefix,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema): void {
  const templateOptions = {
    ...options,
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
  options: AngularLibraryGeneratorSchema,
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
    unitTestRunner: 'jest' as never,
    linter: 'eslint',
    standalone: true,
    routing: false,
    skipModule: true,
    skipTests: true,
    prefix: normalizedOptions.prefix,
    style: 'scss',
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

  projectConfig.targets = projectConfig.targets ?? {};
  projectConfig.targets.lint = {
    executor: '@nx/eslint:lint',
    options: {
      lintFilePatterns: [
        `${projectConfig.root}/**/*.ts`,
        `${projectConfig.root}/**/*.html`,
      ],
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
