import { createAuthorizedFetch } from './createAuthorizedFetch';

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
});
