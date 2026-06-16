import { SafeAny } from '@steam-idler/infra';

type CacheArg = SafeAny[];
type CacheResult = SafeAny;

export type CacheKeyGenerator<TArgs = CacheArg, TResult = CacheResult> = (
  args: TArgs,
  result?: TResult,
) => string | string[];

export interface CacheableOptions<TArgs = CacheArg> {
  key: string | CacheKeyGenerator<TArgs, undefined>;
  ttl?: number;
}

export interface CacheEvictOptions<TArgs = CacheArg, TResult = CacheResult> {
  keys: (string | CacheKeyGenerator<TArgs, TResult>)[];
}
