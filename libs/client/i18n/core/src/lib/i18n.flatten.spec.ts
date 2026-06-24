import { NestedBundle } from '@steam-idler/client/i18n/types';

import { flattenBundle } from './i18n.flatten';

describe('flattenBundle', () => {
  it('returns an empty bundle for an empty source', () => {
    expect(flattenBundle({})).toEqual({});
  });

  it('keeps top-level string entries as-is', () => {
    const source: NestedBundle = { hello: 'world', bye: 'now' };

    expect(flattenBundle(source)).toEqual({ hello: 'world', bye: 'now' });
  });

  it('joins nested keys with dots', () => {
    const source: NestedBundle = {
      auth: {
        signIn: 'Sign in',
        signOut: 'Sign out',
      },
    };

    expect(flattenBundle(source)).toEqual({
      'auth.signIn': 'Sign in',
      'auth.signOut': 'Sign out',
    });
  });

  it('flattens deeply nested structures', () => {
    const source: NestedBundle = {
      page: {
        settings: {
          title: 'Settings',
        },
      },
    };

    expect(flattenBundle(source)).toEqual({
      'page.settings.title': 'Settings',
    });
  });

  it('honours a starting prefix', () => {
    const source: NestedBundle = { title: 'Home' };

    expect(flattenBundle(source, 'page')).toEqual({ 'page.title': 'Home' });
  });

  it('writes into the provided target and returns it', () => {
    const target = { existing: 'value' };

    const result = flattenBundle({ added: 'entry' }, '', target);

    expect(result).toBe(target);
    expect(result).toEqual({ existing: 'value', added: 'entry' });
  });

  it('ignores non-string leaf values', () => {
    const source = {
      keep: 'yes',
      drop: 42,
      gone: null,
    } as unknown as NestedBundle;

    expect(flattenBundle(source)).toEqual({ keep: 'yes' });
  });
});
