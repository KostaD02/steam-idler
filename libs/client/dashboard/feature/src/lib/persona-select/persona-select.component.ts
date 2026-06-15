import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { TranslatePipe } from '@steam-idler/client/i18n/ui';
import { SteamPersonaStatus } from '@steam-idler/server/steam-account/types';

import { PERSONA_OPTIONS, personaPresentation } from './persona';

@Component({
  selector: 'si-persona-select',
  templateUrl: './persona-select.component.html',
  styleUrl: './persona-select.component.scss',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonaSelectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly listbox = viewChild<ElementRef<HTMLUListElement>>('listbox');
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly persona = input.required<SteamPersonaStatus>();
  readonly disabled = input(false);

  readonly personaChange = output<SteamPersonaStatus>();

  readonly options = PERSONA_OPTIONS;
  readonly listboxId = `persona-listbox-${Math.random().toString(36).substring(2)}`;
  readonly isOpen = signal(false);
  readonly activeIndex = signal(0);

  readonly current = computed(() => personaPresentation(this.persona()));
  readonly activeOptionId = computed(() =>
    this.isOpen() ? this.optionId(this.activeIndex()) : null,
  );

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.listbox()?.nativeElement.focus();
      }
    });
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    const index = this.options.findIndex(
      (option) => option.value === this.persona(),
    );
    this.activeIndex.set(Math.max(0, index));
    this.isOpen.set(true);
  }

  close(focusTrigger = false): void {
    this.isOpen.set(false);

    if (focusTrigger) {
      this.trigger()?.nativeElement.focus();
    }
  }

  choose(value: SteamPersonaStatus): void {
    this.close(true);

    if (value !== this.persona()) {
      this.personaChange.emit(value);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) =>
          Math.min(this.options.length - 1, i + 1),
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
        this.activeIndex.set(this.options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.choose(this.options[this.activeIndex()].value);
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }

    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
