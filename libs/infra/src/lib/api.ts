export const API_CONFIG = {
  REQUEST_ID_HEADER: 'x-request-id',
} as const;

export const API_PAGINATION = {
  DEFAULT_INDEX: 1,
  MINIMUM_INDEX: 1,
  DEFAULT_SIZE: 5,
  MINIMUM_SIZE: 1,
  MAXIMUM_SIZE: 100,
} as const;
