import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import {
  Locale,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from '@steam-idler/client/i18n/types';

import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'si-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly i18n = inject(I18nService);
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly listbox = viewChild<ElementRef<HTMLUListElement>>('listbox');
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly listboxId = `language-listbox-${Math.random().toString(36).substring(2)}`;
  readonly locales = SUPPORTED_LOCALES;
  readonly labels = LOCALE_LABELS;
  readonly current = this.i18n.locale;
  readonly isOpen = signal(false);
  readonly activeIndex = signal(0);

  readonly activeOptionId = computed(() =>
    this.isOpen() ? this.optionId(this.activeIndex()) : null,
  );

  constructor() {
    effect(() => {
      if (this.isOpen()) this.listbox()?.nativeElement.focus();
    });
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.activeIndex.set(Math.max(0, this.locales.indexOf(this.current())));
    this.isOpen.set(true);
  }

  close(focusTrigger = false): void {
    this.isOpen.set(false);
    if (focusTrigger) this.trigger()?.nativeElement.focus();
  }

  async select(locale: Locale): Promise<void> {
    const switched = await this.i18n.setLocale(locale);

    if (switched) {
      this.close(true);
    } else {
      // TODO: replace with a snackbar / proper alert UI.
      window.alert(this.i18n.t('ui.i18n.load_error'));
    }
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) =>
          Math.min(this.locales.length - 1, i + 1),
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(this.locales.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        void this.select(this.locales[this.activeIndex()]);
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close(true);
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;

    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
