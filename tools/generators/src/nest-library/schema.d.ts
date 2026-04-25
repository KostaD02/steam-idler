export interface NestLibraryGeneratorSchema {
  name: string;
  type:
    | 'core'
    | 'domain'
    | 'data-access'
    | 'feature'
    | 'util'
    | 'types'
    | 'events';
  directory?: string;
  tags?: string;
  buildable?: boolean;
  publishable?: boolean;
  importPath?: string;
  skipFormat?: boolean;
}
