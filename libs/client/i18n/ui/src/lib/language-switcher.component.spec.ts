import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import { Locale } from '@steam-idler/client/i18n/types';

import { LanguageSwitcherComponent } from './language-switcher.component';

const buildI18nStub = () => ({
  locale: signal<Locale>('en'),
  setLocale: jest.fn().mockResolvedValue(true),
  t: jest.fn((key: string) => key),
});

type I18nStub = ReturnType<typeof buildI18nStub>;

const keydown = (
  fixture: ComponentFixture<LanguageSwitcherComponent>,
  key: string,
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key });
  jest.spyOn(event, 'preventDefault');
  fixture.componentInstance.onKeydown(event);
  fixture.detectChanges();
  return event;
};

const setup = async () => {
  const i18n = buildI18nStub();

  await TestBed.configureTestingModule({
    imports: [LanguageSwitcherComponent],
    providers: [{ provide: I18nService, useValue: i18n }],
  }).compileComponents();

  const fixture = TestBed.createComponent(LanguageSwitcherComponent);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    i18n: i18n as I18nStub,
  };
};

describe('LanguageSwitcherComponent', () => {
  it('starts closed', async () => {
    const { component } = await setup();

    expect(component.isOpen()).toBe(false);
    expect(component.activeOptionId()).toBeNull();
  });

  it('renders one option per supported locale once opened', async () => {
    const { fixture, component } = await setup();

    component.open();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(options).toHaveLength(component.locales.length);
    expect(options[0].textContent.trim()).toBe('English');
    expect(options[1].textContent.trim()).toBe('ქართული');
  });

  describe('optionId', () => {
    it('builds a stable id from the listbox id and the index', async () => {
      const { component } = await setup();

      expect(component.optionId(2)).toBe(`${component.listboxId}-option-2`);
    });
  });

  describe('toggle', () => {
    it('opens when closed', async () => {
      const { component } = await setup();

      component.toggle();

      expect(component.isOpen()).toBe(true);
    });

    it('closes when open', async () => {
      const { component } = await setup();
      component.open();

      component.toggle();

      expect(component.isOpen()).toBe(false);
    });
  });

  describe('open', () => {
    it('opens and points the active index at the current locale', async () => {
      const { component, i18n } = await setup();
      i18n.locale.set('ka');

      component.open();

      expect(component.isOpen()).toBe(true);
      expect(component.activeIndex()).toBe(component.locales.indexOf('ka'));
    });

    it('falls back to the first option when the current locale is unknown', async () => {
      const { component, i18n } = await setup();
      i18n.locale.set('xx' as Locale);

      component.open();

      expect(component.activeIndex()).toBe(0);
    });

    it('exposes the active option id while open', async () => {
      const { component } = await setup();

      component.open();

      expect(component.activeOptionId()).toBe(component.optionId(0));
    });
  });

  describe('close', () => {
    it('closes the listbox', async () => {
      const { component } = await setup();
      component.open();

      component.close();

      expect(component.isOpen()).toBe(false);
    });

    it('returns focus to the trigger when asked', async () => {
      const { fixture, component } = await setup();
      component.open();
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      const focus = jest.spyOn(trigger, 'focus');

      component.close(true);

      expect(focus).toHaveBeenCalled();
    });
  });

  describe('select', () => {
    it('closes and refocuses the trigger when the switch succeeds', async () => {
      const { component, i18n } = await setup();
      component.open();

      await component.select('ka');

      expect(i18n.setLocale).toHaveBeenCalledWith('ka');
      expect(component.isOpen()).toBe(false);
    });

    it('alerts and stays open when the switch fails', async () => {
      const { component, i18n } = await setup();
      i18n.setLocale.mockResolvedValueOnce(false);
      const alert = jest
        .spyOn(window, 'alert')
        .mockImplementation(() => undefined);

      component.open();
      await component.select('ka');

      expect(alert).toHaveBeenCalledWith('ui.i18n.load_error');
      expect(component.isOpen()).toBe(true);

      alert.mockRestore();
    });
  });

  describe('onKeydown', () => {
    it('moves the active index down on ArrowDown without exceeding the last option', async () => {
      const { fixture, component } = await setup();
      component.open();

      keydown(fixture, 'ArrowDown');
      expect(component.activeIndex()).toBe(1);

      component.activeIndex.set(component.locales.length - 1);

      keydown(fixture, 'ArrowDown');
      expect(component.activeIndex()).toBe(component.locales.length - 1);
    });

    it('moves the active index up on ArrowUp without going below zero', async () => {
      const { fixture, component } = await setup();
      component.open();
      component.activeIndex.set(1);

      keydown(fixture, 'ArrowUp');
      expect(component.activeIndex()).toBe(0);

      keydown(fixture, 'ArrowUp');
      expect(component.activeIndex()).toBe(0);
    });

    it('jumps to the first option on Home', async () => {
      const { fixture, component } = await setup();
      component.open();
      component.activeIndex.set(1);

      keydown(fixture, 'Home');

      expect(component.activeIndex()).toBe(0);
    });

    it('jumps to the last option on End', async () => {
      const { fixture, component } = await setup();
      component.open();

      keydown(fixture, 'End');

      expect(component.activeIndex()).toBe(component.locales.length - 1);
    });

    it('selects the active locale on Enter', async () => {
      const { fixture, component, i18n } = await setup();
      component.open();
      component.activeIndex.set(1);

      keydown(fixture, 'Enter');

      expect(i18n.setLocale).toHaveBeenCalledWith(component.locales[1]);
    });

    it('selects the active locale on Space', async () => {
      const { fixture, component, i18n } = await setup();
      component.open();

      keydown(fixture, ' ');

      expect(i18n.setLocale).toHaveBeenCalledWith(component.locales[0]);
    });

    it('closes on Escape', async () => {
      const { fixture, component } = await setup();
      component.open();

      keydown(fixture, 'Escape');

      expect(component.isOpen()).toBe(false);
    });

    it('closes on Tab', async () => {
      const { fixture, component } = await setup();
      component.open();

      keydown(fixture, 'Tab');

      expect(component.isOpen()).toBe(false);
    });

    it('prevents the default action for handled keys', async () => {
      const { fixture, component } = await setup();
      component.open();

      const event = keydown(fixture, 'ArrowDown');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignores unrelated keys', async () => {
      const { fixture, component } = await setup();
      component.open();

      const event = keydown(fixture, 'a');

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.isOpen()).toBe(true);
    });
  });

  describe('onDocumentClick', () => {
    it('does nothing while the listbox is closed', async () => {
      const { component } = await setup();

      component.onDocumentClick({
        target: document.body,
      } as unknown as MouseEvent);

      expect(component.isOpen()).toBe(false);
    });

    it('closes when the click lands outside the host', async () => {
      const { component } = await setup();
      component.open();

      component.onDocumentClick({
        target: document.body,
      } as unknown as MouseEvent);

      expect(component.isOpen()).toBe(false);
    });

    it('stays open when the click lands inside the host', async () => {
      const { fixture, component } = await setup();
      component.open();
      fixture.detectChanges();
      const inside = fixture.nativeElement.querySelector(
        '.language-switcher__trigger',
      );

      component.onDocumentClick({ target: inside } as unknown as MouseEvent);

      expect(component.isOpen()).toBe(true);
    });
  });
});
