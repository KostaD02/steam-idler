# server-infra-cache

Decorator-driven read-through caching and invalidation for NestJS, backed by
Redis with an automatic in-memory fallback.

```ts
@CacheRepository()
class ExampleRepository {
  @Cacheable({ key: (args) => buildCacheKey('id', String(args[0])) })
  findById(id: string) {
    /* ... */
  }

  @CacheEvict({ keys: ['all', (args) => buildCacheKey('id', String(args[0]))] })
  update(id: string, data: unknown) {
    /* ... */
  }
}
```

TTL values are in **milliseconds** (cache-manager v7).

## Building

Run `nx build server-infra-cache` to build the library.

## Running unit tests

Run `nx test server-infra-cache` to execute the unit tests via [Jest](https://jestjs.io).
