import { getCsrfToken } from 'next-auth/react';

/**
 * Fetch wrapper that automatically includes the CSRF token
 * for state-changing requests (POST, PUT, DELETE, PATCH).
 * Use this instead of plain fetch() in authenticated dashboard pages.
 */
export async function fetchWithCsrf(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  if (needsCsrf) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'x-csrf-token': csrfToken,
      };
    }
  }

  return fetch(url, options);
}
