import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '@steam-idler/client/header/ui';

@Component({
  imports: [RouterModule, HeaderComponent],
  selector: 'si-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
