import { TOKEN_COOKIE, USER_COOKIE } from '@labrute/core';
import { getCookie } from './cookies';

type HeadersType = {
  Accept: string;
  'x-csrf-token': string;
  Authorization: string;
  'Content-Type'?: string;
};

export type ErrorType = string | {
  message: string;
  statusText: string;
  status: number;
};

const Fetch = <ReturnType>(url: string, data = {}, method = 'GET', additionalURLParams = {}): Promise<ReturnType> => {
  // Ensure we have a CSRF token once before first request
  if (!localStorage.getItem('csrfToken')) {
    return new Promise((resolve, reject) => {
      fetch('/api/csrf', { headers: { Accept: 'application/json' }, credentials: 'include' })
        .then((response) => response.json())
        .then((json) => {
          localStorage.setItem('csrfToken', (json as { csrfToken: string }).csrfToken);
          resolve(Fetch(url, data, method, additionalURLParams));
        })
        .catch(reject);
    });
  }

  let body: Blob | FormData | string | null = null;
  let finalUrl = url;

  if (method === 'GET') {
    finalUrl += `?${new URLSearchParams({ ...data as any, ...additionalURLParams as any }).toString()}`;
  } else {
    finalUrl += `?${new URLSearchParams({ ...additionalURLParams as any }).toString()}`;
    body = (data instanceof FormData || data instanceof Blob) ? data : JSON.stringify(data);
  }

  return new Promise((resolve, reject) => {
    const user = getCookie(USER_COOKIE) || '';
    const token = getCookie(TOKEN_COOKIE) || '';

    const buildHeaders = (): HeadersType => ({
      Accept: 'application/json',
      'x-csrf-token': localStorage.getItem('csrfToken') || '',
      Authorization: user ? `Basic ${btoa(`${user}:${token}`)}` : ''
    });

    const doFetch = (retried = false) => {
      const headers = buildHeaders();
      if (!(data instanceof FormData) && !(data instanceof Blob)) {
        headers['Content-Type'] = 'application/json';
      }

      fetch(finalUrl, { headers, method, body, credentials: 'include' })
        .then(async (response) => {
          const contentType = response.headers.get('content-type') || '';

          const refreshCsrfAndRetry = async () => {
            if (retried || response.status !== 403) return false;
            try {
              localStorage.removeItem('csrfToken');
              const r = await fetch('/api/csrf', { headers: { Accept: 'application/json' }, credentials: 'include' });
              if (!r.ok) return false;
              const j = await r.json() as { csrfToken?: string };
              if (j?.csrfToken) localStorage.setItem('csrfToken', j.csrfToken);
              doFetch(true);
              return true;
            } catch {
              return false;
            }
          };

          if (contentType.includes('application/json')) {
            const json = await response.json();
            if (response.status >= 200 && response.status < 300) {
              resolve(json as ReturnType);
            } else if (response.status === 403 && !retried) {
              const ok = await refreshCsrfAndRetry();
              if (!ok) reject(json as ReturnType);
            } else {
              reject(json as ReturnType);
            }
          } else {
            const text = await response.text();
            if (response.status === 999) {
              window.location.href = '/generating-tournaments';
              return;
            }
            if (response.status === 403 && !retried) {
              const ok = await refreshCsrfAndRetry();
              if (!ok) {
                reject({ message: text, statusText: response.statusText, status: response.status } as any);
              }
              return;
            }
            reject({ message: text, statusText: response.statusText, status: response.status } as any);
          }
        })
        .catch((error) => reject(error));
    };

    doFetch(false);
  });
};

export default Fetch;


