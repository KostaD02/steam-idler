export const LogLevelEnum = {
  None: 0,
  ErrorOnly: 1,
  All: 2,
} as const;

export type LogLevel = (typeof LogLevelEnum)[keyof typeof LogLevelEnum];
