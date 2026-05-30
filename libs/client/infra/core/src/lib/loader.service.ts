import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly _isVisible = signal<boolean>(false);

  readonly isVisible = this._isVisible.asReadonly();

  show(): void {
    this._isVisible.set(true);
  }

  hide(): void {
    this._isVisible.set(false);
  }
}
