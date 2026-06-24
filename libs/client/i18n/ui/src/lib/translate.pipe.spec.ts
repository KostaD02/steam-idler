import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import { Locale, TranslationParams } from '@steam-idler/client/i18n/types';

import { TranslatePipe } from './translate.pipe';

const buildI18nStub = () => ({
  locale: signal<Locale>('en'),
  t: jest.fn((key: string, params?: TranslationParams) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
});

type I18nStub = ReturnType<typeof buildI18nStub>;

const setup = () => {
  const i18n = buildI18nStub();
  TestBed.configureTestingModule({
    providers: [{ provide: I18nService, useValue: i18n }],
  });
  const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
  return { pipe, i18n: i18n as I18nStub };
};

describe('TranslatePipe', () => {
  it('returns an empty string when the key is null', () => {
    const { pipe, i18n } = setup();

    expect(pipe.transform(null)).toBe('');
    expect(i18n.t).not.toHaveBeenCalled();
  });

  it('returns an empty string when the key is undefined', () => {
    const { pipe, i18n } = setup();

    expect(pipe.transform(undefined)).toBe('');
    expect(i18n.t).not.toHaveBeenCalled();
  });

  it('returns an empty string when the key is an empty string', () => {
    const { pipe, i18n } = setup();

    expect(pipe.transform('')).toBe('');
    expect(i18n.t).not.toHaveBeenCalled();
  });

  it('delegates to the service to translate the key', () => {
    const { pipe, i18n } = setup();

    expect(pipe.transform('ui.header.title')).toBe('ui.header.title');
    expect(i18n.t).toHaveBeenCalledWith('ui.header.title', undefined);
  });

  it('forwards interpolation params to the service', () => {
    const { pipe, i18n } = setup();

    const result = pipe.transform('ui.greeting', { name: 'Sam' });

    expect(i18n.t).toHaveBeenCalledWith('ui.greeting', { name: 'Sam' });
    expect(result).toBe('ui.greeting:{"name":"Sam"}');
  });

  it('reads the locale signal so the impure pipe re-runs on language change', () => {
    const { pipe, i18n } = setup();
    i18n.t.mockImplementation((key: string) =>
      i18n.locale() === 'ka' ? 'მთავარი' : 'Home',
    );

    expect(pipe.transform('ui.home')).toBe('Home');

    i18n.locale.set('ka');

    expect(pipe.transform('ui.home')).toBe('მთავარი');
  });
});
