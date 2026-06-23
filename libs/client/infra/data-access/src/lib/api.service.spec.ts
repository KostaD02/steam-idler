import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ConfigService } from './config.service';

const API_BASE = 'https://api.example.com';

const setup = (apiBase: string | null = API_BASE) => {
  const configService = {
    config: apiBase === null ? null : { apiBase },
  };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ConfigService, useValue: configService },
    ],
  });

  return {
    service: TestBed.inject(ApiService),
    controller: TestBed.inject(HttpTestingController),
  };
};

describe('ApiService', () => {
  describe('apiBase', () => {
    it('returns the configured base url', () => {
      const { service } = setup();

      expect(service.apiBase).toBe(API_BASE);
    });

    it('falls back to an empty string when config is null', () => {
      const { service } = setup(null);

      expect(service.apiBase).toBe('');
    });
  });

  describe('get', () => {
    it('issues a credentialed GET against the prefixed url', () => {
      const { service, controller } = setup();
      let body: unknown;

      service.get<{ ok: boolean }>('/users').subscribe((b) => (body = b));

      const req = controller.expectOne(`${API_BASE}/users`);

      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      req.flush({ ok: true });

      expect(body).toEqual({ ok: true });
      controller.verify();
    });
  });

  describe('post', () => {
    it('sends the body with credentials', () => {
      const { service, controller } = setup();
      const payload = { name: 'a' };

      service.post('/users', payload).subscribe();

      const req = controller.expectOne(`${API_BASE}/users`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.withCredentials).toBe(true);

      req.flush({});
      controller.verify();
    });
  });

  describe('patch', () => {
    it('sends a credentialed PATCH with the body', () => {
      const { service, controller } = setup();
      const payload = { name: 'b' };

      service.patch('/users/1', payload).subscribe();

      const req = controller.expectOne(`${API_BASE}/users/1`);

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      expect(req.request.withCredentials).toBe(true);

      req.flush({});
      controller.verify();
    });
  });

  describe('put', () => {
    it('sends a credentialed PUT with the body', () => {
      const { service, controller } = setup();
      const payload = { name: 'c' };

      service.put('/users/1', payload).subscribe();

      const req = controller.expectOne(`${API_BASE}/users/1`);

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      expect(req.request.withCredentials).toBe(true);

      req.flush({});
      controller.verify();
    });
  });

  describe('delete', () => {
    it('issues a credentialed DELETE against the prefixed url', () => {
      const { service, controller } = setup();

      service.delete('/users/1').subscribe();

      const req = controller.expectOne(`${API_BASE}/users/1`);

      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);

      req.flush({});
      controller.verify();
    });

    it('prefixes the endpoint with an empty base when config is null', () => {
      const { service, controller } = setup(null);

      service.delete('/users/1').subscribe();

      const req = controller.expectOne('/users/1');
      req.flush({});
      controller.verify();
    });
  });

  describe('stream', () => {
    class EventSourceStub {
      static instances: EventSourceStub[] = [];
      listeners = new Map<string, (event: MessageEvent) => void>();
      onerror: (() => void) | null = null;
      close = jest.fn();

      constructor(
        public url: string,
        public init: { withCredentials: boolean },
      ) {
        EventSourceStub.instances.push(this);
      }

      addEventListener(event: string, cb: (event: MessageEvent) => void): void {
        this.listeners.set(event, cb);
      }

      emit(event: string, data: string): void {
        this.listeners.get(event)?.({ data } as MessageEvent);
      }
    }

    const originalEventSource = global.EventSource;

    beforeEach(() => {
      EventSourceStub.instances = [];
      (global as unknown as { EventSource: unknown }).EventSource =
        EventSourceStub;
    });

    afterEach(() => {
      (global as unknown as { EventSource: unknown }).EventSource =
        originalEventSource;
    });

    it('opens a credentialed EventSource at the prefixed url', () => {
      const { service } = setup();

      const subscription = service.stream('/events', ['tick']).subscribe();
      const source = EventSourceStub.instances[0];

      expect(source.url).toBe(`${API_BASE}/events`);
      expect(source.init.withCredentials).toBe(true);

      subscription.unsubscribe();
    });

    it('emits parsed events for each registered event name', () => {
      const { service } = setup();
      const received: { event: string; data: unknown }[] = [];

      const subscription = service
        .stream('/events', ['tick'])
        .subscribe((value) => received.push(value));

      EventSourceStub.instances[0].emit('tick', JSON.stringify({ count: 1 }));

      expect(received).toEqual([{ event: 'tick', data: { count: 1 } }]);

      subscription.unsubscribe();
    });

    it('errors with stream_parse_error on malformed payloads', () => {
      const { service } = setup();
      let error: Error | undefined;

      service.stream('/events', ['tick']).subscribe({
        error: (err: Error) => (error = err),
      });

      EventSourceStub.instances[0].emit('tick', 'not-json');

      expect(error?.message).toBe('stream_parse_error');
    });

    it('errors with stream_connection_error when the source fails', () => {
      const { service } = setup();
      let error: Error | undefined;

      service.stream('/events', ['tick']).subscribe({
        error: (err: Error) => (error = err),
      });

      EventSourceStub.instances[0].onerror?.();

      expect(error?.message).toBe('stream_connection_error');
    });

    it('closes the source when the subscription is torn down', () => {
      const { service } = setup();

      const subscription = service.stream('/events', ['tick']).subscribe();
      const source = EventSourceStub.instances[0];

      subscription.unsubscribe();

      expect(source.close).toHaveBeenCalledTimes(1);
    });
  });
});
