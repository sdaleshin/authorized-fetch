export interface Tokens {
  token: string;
  refreshToken: string;
}

export interface CreateAuthorizedFetchOptions {
  fetch: typeof fetch;
  isSuccessfulStatusCode: (statusCode: number) => boolean;
  isUnauthorizedStatusCode: (statusCode: number) => boolean;
  onRefreshFailure?: () => void;
}
