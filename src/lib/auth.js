import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

const SESSION_COOKIE = "admin_session";
const CSRF_COOKIE = "admin_csrf";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$/;

const ensureStrongAdminPassword = () => {
  const adminPass = process.env.ADMIN_PASSWORD || "";
  if (!PASSWORD_POLICY.test(adminPass)) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters and include upper, lower, number, and special characters"
    );
  }
};

ensureStrongAdminPassword();

const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is required for admin authentication");
  }
  return secret;
};

const encodePayload = (payload) => Buffer.from(JSON.stringify(payload)).toString("base64url");
const decodePayload = (encoded) => JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));

const signPayload = (encoded) =>
  crypto.createHmac("sha256", getSecret()).update(encoded).digest("hex");

const safeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

export const validateAdminCredentials = (username, password) => {
  const adminUser = process.env.ADMIN_USERNAME || "admin@example.com";
  const adminPass = process.env.ADMIN_PASSWORD || "";
  return username === adminUser && password === adminPass;
};

export const createSessionToken = () => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const issuedAt = Date.now();
  const payload = {
    sub: process.env.ADMIN_USERNAME || "admin",
    exp: issuedAt + SESSION_TTL_MS,
    iat: issuedAt,
    sid: crypto.randomUUID(),
    csrf: csrfToken,
  };
  const encoded = encodePayload(payload);
  const signature = signPayload(encoded);
  return { token: `${encoded}.${signature}`, csrfToken };
};

export const verifySessionToken = (token) => {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = signPayload(encoded);
  if (!safeEqual(signature, expected)) {
    return null;
  }
  const payload = decodePayload(encoded);
  if (payload.exp && payload.exp < Date.now()) {
    return null;
  }
  return payload;
};

const resolveMaybePromise = async (value) => {
  if (value && typeof value.then === "function") {
    return await value;
  }
  return value;
};

const getCookieStore = async () => {
  try {
    return await resolveMaybePromise(cookies());
  } catch (error) {
    console.warn("getCookieStore: cookies() unavailable in this context", error);
    return null;
  }
};

export const getAdminSession = async () => {
  const store = await getCookieStore();
  if (!store || typeof store.get !== "function") {
    return null;
  }
  const cookie = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(cookie);
};

export const requireAdminUser = async () => {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
};

export const ensureAdminApi = async (request, { requireCsrf = true } = {}) => {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }
  if (!requireCsrf) {
    return session;
  }

  const resolvedRequest = await resolveMaybePromise(request);
  const csrfHeader = resolvedRequest?.headers?.get?.("x-csrf-token");
  const store = await getCookieStore();
  const csrfCookie = store?.get(CSRF_COOKIE)?.value;

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie || csrfCookie !== session.csrf) {
    return null;
  }
  return session;
};

export const setAdminSessionCookie = (response) => {
  const { token, csrfToken } = createSessionToken();
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  response.cookies.set({
    name: CSRF_COOKIE,
    value: csrfToken,
    httpOnly: false,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
};

export const clearAdminSessionCookie = (response) => {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set({
    name: CSRF_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
  });
};
