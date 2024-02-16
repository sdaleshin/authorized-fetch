# authorized-fetch
This npm package provides a method createAuthorizedFetch for creating an authorized fetch function that automatically handles token authentication and refresh.

### Install

```shell
npm i authorized-fetch
```

### Method
```ts
createAuthorizedFetch(
  getTokens: () => Promise<Tokens>,
  setTokens: (tokens: Tokens) => void,
  refreshUrl?: string,
  options?: CreateAuthorizedFetchOptions,
): (url: string, options: RequestInit) => Promise<Response>;
```
### Parameters
**getTokens**: A function that returns a Promise resolving to the current tokens.<br/>
**setTokens**: A function to update tokens.<br/>
**refreshUrl**: An optional URL for token refresh.<br/>
**options**: Optional fetch options.

### Returns
A function that accepts a URL and fetch options and returns a Promise resolving to a Response object.

### Usage
```ts
import { createAuthorizedFetch, Tokens } from 'authorized-fetch';

// Define getTokens function
const getTokens = async () => {
  return JSON.parse(localStorage.get('tokens'))
};

// Define setTokens function
const setTokens = (tokens: Tokens) => {
  localStorage.setItem('tokens', JSON.stringify(tokens))
};

// Create authorized fetch function
const authorizedFetch = createAuthorizedFetch(getTokens, setTokens);

// Usage example
authorizedFetch('https://api.example.com/data', {
  method: 'GET',
}).then(response => {
  // Handle response
}).catch(error => {
  // Handle error
});
```
This method handles token authentication by automatically attaching the token to the Authorization header of the request. If the token expires (returns 401), it attempts to refresh the token using the provided **refreshUrl**. If successful, it retries the original request with the new token.
