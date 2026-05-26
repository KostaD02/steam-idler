import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'si-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {}
