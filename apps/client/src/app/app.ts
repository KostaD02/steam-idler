import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppConfig } from './config/app-config';

@Component({
  imports: [RouterModule, AsyncPipe],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject(AppConfig);

  readonly errorKeys = this.httpClient.get<string[]>(
    `${this.config.apiBase}/error-keys`,
  );
}
