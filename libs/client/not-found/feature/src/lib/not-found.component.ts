import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'si-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
