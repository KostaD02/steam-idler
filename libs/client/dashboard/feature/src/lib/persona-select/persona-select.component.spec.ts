import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import {
  SteamPersonaStatus,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

import { PersonaSelectComponent } from './persona-select.component';

const buildI18nStub = () => ({
  locale: jest.fn().mockReturnValue('en'),
  t: jest.fn((key: string) => key),
});

const keydown = (
  fixture: ComponentFixture<PersonaSelectComponent>,
  key: string,
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key });
  jest.spyOn(event, 'preventDefault');
  fixture.componentInstance.onKeydown(event);
  fixture.detectChanges();

  return event;
};

const setup = async (
  persona: SteamPersonaStatus = SteamPersonaStatusEnum.Online,
) => {
  await TestBed.configureTestingModule({
    imports: [PersonaSelectComponent],
    providers: [{ provide: I18nService, useValue: buildI18nStub() }],
  }).compileComponents();

  const fixture = TestBed.createComponent(PersonaSelectComponent);
  fixture.componentRef.setInput('persona', persona);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance };
};

describe('PersonaSelectComponent', () => {
  it('starts closed with no active option id', async () => {
    const { component } = await setup();

    expect(component.isOpen()).toBe(false);
    expect(component.activeOptionId()).toBeNull();
  });

  it('exposes the presentation for the current persona', async () => {
    const { component } = await setup(SteamPersonaStatusEnum.Busy);

    expect(component.current().value).toBe(SteamPersonaStatusEnum.Busy);
    expect(component.current().labelKey).toBe('ui.dashboard.persona.busy');
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

    it('does nothing while disabled', async () => {
      const { fixture, component } = await setup();
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      component.toggle();

      expect(component.isOpen()).toBe(false);
    });
  });

  describe('open', () => {
    it('points the active index at the current persona', async () => {
      const { component } = await setup(SteamPersonaStatusEnum.Busy);

      component.open();

      const expected = component.options.findIndex(
        (option) => option.value === SteamPersonaStatusEnum.Busy,
      );
      expect(component.isOpen()).toBe(true);
      expect(component.activeIndex()).toBe(expected);
    });

    it('falls back to the first option when the persona is not selectable', async () => {
      const { component } = await setup(SteamPersonaStatusEnum.Offline);

      component.open();

      expect(component.activeIndex()).toBe(0);
    });

    it('exposes the active option id while open', async () => {
      const { component } = await setup();

      component.open();

      expect(component.activeOptionId()).toBe(
        component.optionId(component.activeIndex()),
      );
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
      const trigger = fixture.nativeElement.querySelector(
        '.persona-select__trigger',
      ) as HTMLButtonElement;
      const focus = jest.spyOn(trigger, 'focus');

      component.close(true);

      expect(focus).toHaveBeenCalled();
    });
  });

  describe('choose', () => {
    it('emits the new persona and closes when the value differs', async () => {
      const { component } = await setup(SteamPersonaStatusEnum.Online);
      const emitted: SteamPersonaStatus[] = [];
      component.personaChange.subscribe((value) => emitted.push(value));
      component.open();

      component.choose(SteamPersonaStatusEnum.Away);

      expect(emitted).toEqual([SteamPersonaStatusEnum.Away]);
      expect(component.isOpen()).toBe(false);
    });

    it('closes without emitting when the value is unchanged', async () => {
      const { component } = await setup(SteamPersonaStatusEnum.Online);
      const change = jest.fn();
      component.personaChange.subscribe(change);
      component.open();

      component.choose(SteamPersonaStatusEnum.Online);

      expect(change).not.toHaveBeenCalled();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('onKeydown', () => {
    it('moves the active index down on ArrowDown without exceeding the last option', async () => {
      const { fixture, component } = await setup();
      component.open();
      component.activeIndex.set(component.options.length - 2);

      keydown(fixture, 'ArrowDown');
      expect(component.activeIndex()).toBe(component.options.length - 1);

      keydown(fixture, 'ArrowDown');
      expect(component.activeIndex()).toBe(component.options.length - 1);
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
      component.activeIndex.set(2);

      keydown(fixture, 'Home');

      expect(component.activeIndex()).toBe(0);
    });

    it('jumps to the last option on End', async () => {
      const { fixture, component } = await setup();
      component.open();

      keydown(fixture, 'End');

      expect(component.activeIndex()).toBe(component.options.length - 1);
    });

    it('chooses the active option on Enter', async () => {
      const { fixture, component } = await setup(SteamPersonaStatusEnum.Online);
      const change = jest.fn();
      component.personaChange.subscribe(change);
      component.open();
      component.activeIndex.set(1);

      keydown(fixture, 'Enter');

      expect(change).toHaveBeenCalledWith(component.options[1].value);
      expect(component.isOpen()).toBe(false);
    });

    it('chooses the active option on Space', async () => {
      const { fixture, component } = await setup(SteamPersonaStatusEnum.Online);
      const change = jest.fn();
      component.personaChange.subscribe(change);
      component.open();
      component.activeIndex.set(1);

      keydown(fixture, ' ');

      expect(change).toHaveBeenCalledWith(component.options[1].value);
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
        '.persona-select__trigger',
      );

      component.onDocumentClick({ target: inside } as unknown as MouseEvent);

      expect(component.isOpen()).toBe(true);
    });
  });
});
