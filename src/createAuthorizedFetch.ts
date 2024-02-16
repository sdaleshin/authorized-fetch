import { CreateAuthorizedFetchOptions, Tokens } from './types';
import { getDefaultOptions } from './getDefaultOptions';

export function createAuthorizedFetch(
  getTokens: () => Promise<Tokens>,
  setTokens: (tokens: Tokens) => void,
  refreshUrl?: string,
  options?: Partial<CreateAuthorizedFetchOptions>,
) {
  let refreshPromise: Promise<Tokens>;
  const { fetch } = { ...getDefaultOptions(), ...options };
  async function refreshToken(refreshToken: string) {
    const refreshTokenResponse = await fetch(refreshUrl!, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (refreshTokenResponse.status !== 201) {
      throw new Error("Can't refresh token");
    }
    return await refreshTokenResponse.json();
  }
  return async function (url: string, options?: RequestInit) {
    let tokens: Tokens = await getTokens();
    if (refreshPromise) {
      tokens = await refreshPromise;
    }
    let response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokens.token,
      },
    });
    if (refreshUrl && response.status === 401) {
      refreshPromise = refreshToken(tokens.refreshToken);
      tokens = await refreshPromise;
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
