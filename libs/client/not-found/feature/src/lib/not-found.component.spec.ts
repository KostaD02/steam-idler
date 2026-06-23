import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import { Locale, TranslationParams } from '@steam-idler/client/i18n/types';

import { NotFoundComponent } from './not-found.component';

const buildI18nStub = () => ({
  locale: signal<Locale>('en'),
  t: jest.fn((key: string, params?: TranslationParams) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  ),
});

const setup = async (): Promise<{
  fixture: ComponentFixture<NotFoundComponent>;
  i18n: ReturnType<typeof buildI18nStub>;
}> => {
  const i18n = buildI18nStub();

  await TestBed.configureTestingModule({
    imports: [NotFoundComponent],
    providers: [{ provide: I18nService, useValue: i18n }],
  }).compileComponents();

  const fixture = TestBed.createComponent(NotFoundComponent);
  fixture.detectChanges();

  return { fixture, i18n };
};

describe('NotFoundComponent', () => {
  it('creates the component', async () => {
    const { fixture } = await setup();

    expect(fixture.componentInstance).toBeInstanceOf(NotFoundComponent);
  });

  it('renders the translated placeholder text', async () => {
    const { fixture } = await setup();

    const paragraph =
      fixture.nativeElement.querySelector<HTMLParagraphElement>('p');

    expect(paragraph?.textContent?.trim()).toBe('ui.not_found.placeholder');
  });

  it('translates the placeholder key through the i18n service', async () => {
    const { i18n } = await setup();

    expect(i18n.t).toHaveBeenCalledWith('ui.not_found.placeholder', undefined);
  });
});
