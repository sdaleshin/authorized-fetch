export interface Tokens {
  token: string;
  refreshToken: string;
}

export interface CreateAuthorizedFetchOptions {
  fetch: typeof fetch;
}
