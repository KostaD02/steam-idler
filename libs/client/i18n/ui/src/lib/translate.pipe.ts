import { inject, Pipe, PipeTransform } from '@angular/core';

import { I18nService } from '@steam-idler/client/i18n/data-access';
import {
  TranslationKey,
  TranslationParams,
} from '@steam-idler/client/i18n/types';

@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(
    key: TranslationKey | null | undefined,
    params?: TranslationParams,
  ): string {
    if (!key) {
      return '';
    }

    this.i18n.locale();
    return this.i18n.t(key, params);
  }
}
