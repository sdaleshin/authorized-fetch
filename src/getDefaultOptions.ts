import { CreateAuthorizedFetchOptions } from './types';

export function getDefaultOptions(): CreateAuthorizedFetchOptions {
  return {
    fetch,
    isSuccessfulStatusCode: (statusCode: number) => {
      return statusCode >= 200 && statusCode < 300;
    },
    isUnauthorizedStatusCode: (statusCode: number) => {
      return statusCode === 401;
    },
  };
}
