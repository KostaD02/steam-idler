import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import { Locale, TranslationParams } from '@steam-idler/client/i18n/types';

import { NotFoundComponent } from './not-found.component';

const sizing = {
  header: 70,
  innerPadding: 32,
  maxContentWidth: 1400,
  innerContentHeight: () => 'calc(100dvh - 134px)',
};

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
    providers: [
      provideRouter([]),
      { provide: LayoutService, useValue: { sizing } },
      { provide: I18nService, useValue: i18n },
    ],
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

  it('renders the 404 code', async () => {
    const { fixture } = await setup();

    const code =
      fixture.nativeElement.querySelector<HTMLParagraphElement>(
        '.not-found__code',
      );

    expect(code?.textContent?.trim()).toBe('404');
    expect(code?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the translated title and description', async () => {
    const { fixture, i18n } = await setup();

    const title =
      fixture.nativeElement.querySelector<HTMLHeadingElement>(
        '.not-found__title',
      );
    const description =
      fixture.nativeElement.querySelector<HTMLParagraphElement>(
        '.not-found__description',
      );

    expect(title?.textContent?.trim()).toBe('ui.not_found.title');
    expect(description?.textContent?.trim()).toBe('ui.not_found.description');
    expect(i18n.t).toHaveBeenCalledWith('ui.not_found.title', undefined);
    expect(i18n.t).toHaveBeenCalledWith('ui.not_found.description', undefined);
  });

  it('links back to the dashboard', async () => {
    const { fixture } = await setup();

    const link =
      fixture.nativeElement.querySelector<HTMLAnchorElement>('a.kd-btn');

    expect(link?.getAttribute('href')).toBe('/dashboard');
    expect(link?.textContent?.trim()).toBe('ui.not_found.back_to_dashboard');
  });

  it('fills the inner content height', async () => {
    const { fixture } = await setup();

    const section =
      fixture.nativeElement.querySelector<HTMLElement>('.not-found');

    expect(section?.style.minHeight).toBe('calc(100dvh - 134px)');
  });
});
