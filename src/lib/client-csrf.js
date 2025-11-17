'use client';

const CSRF_COOKIE = "admin_csrf";

export const getAdminCsrfToken = () => {
  if (typeof document === "undefined") {
    return "";
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

export const withAdminCsrf = (init = {}) => {
  const token = getAdminCsrfToken();
  if (!token) {
    return init;
  }
  const headers = { ...(init.headers || {}) };
  headers["X-CSRF-Token"] = token;
  return { ...init, headers };
};
