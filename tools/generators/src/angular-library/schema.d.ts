export interface AngularLibraryGeneratorSchema {
  name: string;
  type: 'core' | 'data-access' | 'types' | 'ui' | 'util' | 'shell' | 'feature';
  subname?: string;
  directory?: string;
  tags?: string;
  buildable?: boolean;
  publishable?: boolean;
  importPath?: string;
  prefix?: string;
  skipFormat?: boolean;
}
