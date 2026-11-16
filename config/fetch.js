// axios defaults for the Fetch utility of @averoa/utilities
// (see https://axios-http.com/docs/req_config for every option).
// Per-request options win: Fetch.get('/users', { timeout: 30000 }).
export default {
  // prepended to relative URLs: Fetch.get('/users') -> `${FETCH_BASE_URL}/users`
  baseURL: process.env.FETCH_BASE_URL || undefined,

  // milliseconds before a request is aborted; 0 disables the timeout
  timeout: process.env.FETCH_TIMEOUT !== undefined && process.env.FETCH_TIMEOUT !== ''
    ? Number(process.env.FETCH_TIMEOUT)
    : 10000,

  headers: { 'X-Requested-With': 'XMLHttpRequest' },

  // response / request body size limits in bytes (axios default: -1 = unlimited).
  // Set them when talking to untrusted servers, e.g. 10 * 1024 * 1024 for 10 MB.
  // maxContentLength: -1,
  // maxBodyLength: -1,

  // maximum number of redirects to follow; 0 follows none
  maxRedirects: 5,

  // resolve the promise for these statuses, reject for the others
  // validateStatus: (status) => status >= 200 && status < 300,

  // HTTP Basic auth; for Bearer tokens set headers.Authorization instead
  // auth: { username: process.env.FETCH_USERNAME, password: process.env.FETCH_PASSWORD },

  // proxy: { protocol: 'https', host: '127.0.0.1', port: 9000 },
};
