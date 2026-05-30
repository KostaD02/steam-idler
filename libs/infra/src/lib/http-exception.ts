export type HttpExceptionResponse = {
  error: string;
  status: number;
  message: string | string[];
  errorKeys: string[];
};
