import { createAuthorizedFetch } from './createAuthorizedFetch';
import { Tokens } from './types';

describe('createAuthorizedFetch', () => {
  it('should successfully execute request without token refresh', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'validToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({ status: 200 });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await authorizedFetch('https://example.com/api/data', {});

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/data',
      expect.any(Object),
    );
  });

  it('should successfully execute request with token refresh', async () => {
    // Prepare
    const getTokens = async () => ({
      token: 'expiredToken',
      refreshToken: 'validRefreshToken',
    });
    const setToken = jest.fn();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({
        status: 201,
        json: jest.fn().mockResolvedValueOnce({
          token: 'newToken',
          refreshToken: 'newRefreshToken',
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
      });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      setToken,
      'https//refreshUrl.refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await authorizedFetch('https://example.com/api/data');

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(setToken).toHaveBeenCalledTimes(1);
    expect(setToken).toHaveBeenCalledWith({
      token: 'newToken',
      refreshToken: 'newRefreshToken',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/api/data');
    expect(fetchMock.mock.calls[1][0]).toBe('https//refreshUrl.refreshUrl');
    expect(fetchMock.mock.calls[2][0]).toBe('https://example.com/api/data');
  });

  it('should handle error when getting tokens', async () => {
    // Prepare
    const getTokens = jest
      .fn()
      .mockRejectedValue(new Error('Failed to get tokens'));
    const fetchMock = jest.fn();

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {},
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).rejects.toThrowError('Failed to get tokens');

    // Verify
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should handle error when refreshing token', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'expiredToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ status: 401 })
      .mockRejectedValue(new Error('Failed to refresh token'));

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).rejects.toThrowError('Failed to refresh token');

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should successfully execute request without refreshUrl', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'validToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({ status: 401 });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      undefined,
      {
        fetch: fetchMock,
      },
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).resolves.toEqual({
      status: 401,
    });
    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should properly set Authorization header with token', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'validToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({ status: 200 });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await authorizedFetch('https://example.com/api/data', {});

    // Verify
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/data', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer validToken',
      },
    });
  });
  it('should throw error if refreshToken fails', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'expiredToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({ status: 401 });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).rejects.toThrowError("Can't refresh token");

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('should throw error if fetch fails', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'validToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockRejectedValue(new Error('Failed to fetch'));

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).rejects.toThrowError('Failed to fetch');

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle network errors gracefully', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'validToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network error'));

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).rejects.toThrowError('Network error');

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('parallel requests', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'validToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url === 'http://first.first') {
        return { status: 200, body: 'first' };
      } else if (url === 'http://second.second') {
        return { status: 200, body: 'second' };
      }
    });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );

    await Promise.all([
      expect(authorizedFetch('http://first.first', {})).resolves.toEqual({
        status: 200,
        body: 'first',
      }),
      expect(authorizedFetch('http://second.second', {})).resolves.toEqual({
        status: 200,
        body: 'second',
      }),
    ]);

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('parallel requests with refresh token', async () => {
    // Prepare
    const storage = {
      tokens: {
        token: 'invalidToken',
        refreshToken: 'validRefreshToken',
      },
    };
    const getTokens = async () => {
      return storage.tokens as Tokens;
    };
    const setTokens = (tokens: Tokens) => {
      storage.tokens = tokens;
    };
    const fetchMock = jest
      .fn()
      .mockImplementation((url: string, options: RequestInit) => {
        if (url === 'refreshUrl') {
          return {
            status: 201,
            json: jest.fn().mockResolvedValueOnce({
              token: 'validToken',
              refreshToken: 'newRefreshToken',
            }),
          };
        }
        const headers = options?.headers as Record<string, string>;
        if (headers?.['Authorization'] === 'Bearer validToken') {
          if (url === 'http://first.first') {
            return { status: 200, body: 'first' };
          } else if (url === 'http://second.second') {
            return { status: 200, body: 'second' };
          }
        } else {
          return { status: 401 };
        }
      });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      setTokens,
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );

    await Promise.all([
      expect(authorizedFetch('http://first.first', {})).resolves.toEqual({
        status: 200,
        body: 'first',
      }),
      expect(authorizedFetch('http://second.second', {})).resolves.toEqual({
        status: 200,
        body: 'second',
      }),
    ]);

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls[0][0]).toBe('http://first.first');
    expect(fetchMock.mock.calls[1][0]).toBe('http://second.second');
    expect(fetchMock.mock.calls[2][0]).toBe('refreshUrl');
    expect(fetchMock.mock.calls[3][0]).toBe('http://first.first');
    expect(fetchMock.mock.calls[4][0]).toBe('http://second.second');
  });

  it('sequential requests with refresh token', async () => {
    // Prepare
    const storage = {
      tokens: {
        token: 'invalidToken',
        refreshToken: 'validRefreshToken',
      },
    };
    const getTokens = async () => {
      return storage.tokens as Tokens;
    };
    const setTokens = (tokens: Tokens) => {
      storage.tokens = tokens;
    };
    const fetchMock = jest
      .fn()
      .mockImplementation((url: string, options: RequestInit) => {
        if (url === 'refreshUrl') {
          return {
            status: 201,
            json: jest.fn().mockResolvedValueOnce({
              token: 'validToken',
              refreshToken: 'newRefreshToken',
            }),
          };
        }
        const headers = options?.headers as Record<string, string>;
        if (headers?.['Authorization'] === 'Bearer validToken') {
          if (url === 'http://first.first') {
            return { status: 200, body: 'first' };
          } else if (url === 'http://second.second') {
            return { status: 200, body: 'second' };
          }
        } else {
          return { status: 401 };
        }
      });

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      setTokens,
      'refreshUrl',
      {
        fetch: fetchMock,
      },
    );

    await expect(authorizedFetch('http://first.first', {})).resolves.toEqual({
      status: 200,
      body: 'first',
    });
    await expect(authorizedFetch('http://second.second', {})).resolves.toEqual({
      status: 200,
      body: 'second',
    });
    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][0]).toBe('http://first.first');
    expect(fetchMock.mock.calls[1][0]).toBe('refreshUrl');
    expect(fetchMock.mock.calls[2][0]).toBe('http://first.first');
    expect(fetchMock.mock.calls[3][0]).toBe('http://second.second');
  });
  it('should throw error if refreshToken fails and call onRefreshFailure', async () => {
    // Prepare
    const getTokens = jest.fn().mockResolvedValue({
      token: 'expiredToken',
      refreshToken: 'validRefreshToken',
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({ status: 401 });
    const onRefreshFailure = jest.fn();

    // Execute
    const authorizedFetch = createAuthorizedFetch(
      getTokens,
      jest.fn(),
      'refreshUrl',
      {
        fetch: fetchMock,
        onRefreshFailure,
      },
    );
    await expect(
      authorizedFetch('https://example.com/api/data', {}),
    ).rejects.toThrowError("Can't refresh token");

    // Verify
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onRefreshFailure).toHaveBeenCalledTimes(1);
  });
});
