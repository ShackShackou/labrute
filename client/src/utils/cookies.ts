// Compute cookie domain. For localhost/127.0.0.1, do NOT set domain attribute.
const host = window.location.hostname;
const isLocalHost = (
  host === 'localhost'
  || host === '127.0.0.1'
  || host === '::1'
  || !host.includes('.')
);
const domainAttr = isLocalHost ? '' : `; domain=${host.split('.').slice(-2).join('.')}`;

export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const setCookie = (name: string, value: string, days: number) => {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/${domainAttr}; max-age=${maxAge}; SameSite=Lax`;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/${domainAttr}; max-age=0; SameSite=Lax`;
};
