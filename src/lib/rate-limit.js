const getStore = () => {
  const globalKey = "__ADMIN_RATE_LIMIT_STORE__";
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = new Map();
  }
  return globalThis[globalKey];
};

export const rateLimit = ({ key, limit, windowMs }) => {
  const store = getStore();
  const now = Date.now();
  const windowStart = now - windowMs;
  const entry = store.get(key) || [];
  const recent = entry.filter((timestamp) => timestamp > windowStart);

  if (recent.length >= limit) {
    store.set(key, recent);
    return false;
  }

  recent.push(now);
  store.set(key, recent);
  return true;
};
