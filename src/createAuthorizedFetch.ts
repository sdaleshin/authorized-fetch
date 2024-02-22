import { CreateAuthorizedFetchOptions, Tokens } from './types';
import { getDefaultOptions } from './getDefaultOptions';

export function createAuthorizedFetch(
  getTokens: () => Promise<Tokens>,
  setTokens: (tokens: Tokens) => void,
  refreshUrl?: string,
  options?: Partial<CreateAuthorizedFetchOptions>,
) {
  let refreshPromise: Promise<Tokens>;
  let refreshInProgress = false;
  const {
    fetch,
    isSuccessfulStatusCode,
    isUnauthorizedStatusCode,
    onRefreshFailure,
  } = {
    ...getDefaultOptions(),
    ...options,
  };
  async function refreshToken(refreshToken: string) {
    refreshInProgress = true;
    try {
      const refreshTokenResponse = await fetch(refreshUrl!, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!isSuccessfulStatusCode(refreshTokenResponse?.status)) {
        throw new Error("Can't refresh token");
      }
      return await refreshTokenResponse.json();
    } finally {
      refreshInProgress = false;
    }
  }
  return async function (url: string, options?: RequestInit) {
    let tokens: Tokens = refreshInProgress
      ? await refreshPromise
      : await getTokens();
    let response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokens.token,
      },
    });
    if (refreshUrl && isUnauthorizedStatusCode(response.status)) {
      if (!refreshInProgress) {
        refreshPromise = refreshToken(tokens.refreshToken);
      }
      try {
        tokens = await refreshPromise;
      } catch (e) {
        if (onRefreshFailure) {
          onRefreshFailure();
        }
        throw e;
      }
      setTokens(tokens);
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + tokens.token,
        },
      });
    }
    return response;
  };
}
