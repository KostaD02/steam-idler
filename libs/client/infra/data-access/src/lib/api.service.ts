import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ConfigService } from './config.service';

// TODO: check if is it worth to do with proxy
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly configService = inject(ConfigService);

  readonly config = {
    withCredentials: true,
  };

  get apiBase(): string {
    return this.configService.config?.apiBase ?? '';
  }

  private url(endpoint: string): string {
    return `${this.apiBase}${endpoint}`;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.httpClient.get<T>(this.url(endpoint), this.config);
  }

  post<T>(endpoint: string, body: object): Observable<T> {
    return this.httpClient.post<T>(this.url(endpoint), body, this.config);
  }

  patch<T>(endpoint: string, body: object): Observable<T> {
    return this.httpClient.patch<T>(this.url(endpoint), body, this.config);
  }

  put<T>(endpoint: string, body: object): Observable<T> {
    return this.httpClient.put<T>(this.url(endpoint), body, this.config);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.httpClient.delete<T>(this.url(endpoint), this.config);
  }

  stream(
    endpoint: string,
    eventNames: string[],
  ): Observable<{ event: string; data: unknown }> {
    return new Observable((subscriber) => {
      const source = new EventSource(this.url(endpoint), {
        withCredentials: this.config.withCredentials,
      });

      eventNames.forEach((event) => {
        source.addEventListener(event, (message) => {
          try {
            subscriber.next({
              event,
              data: JSON.parse((message as MessageEvent).data),
            });
          } catch {
            subscriber.error(new Error('stream_parse_error'));
          }
        });
      });

      source.onerror = () => {
        subscriber.error(new Error('stream_connection_error'));
      };

      return () => source.close();
    });
  }
}
