import { headers } from "next/headers";

const resolveMaybePromise = async (value) => {
  if (value && typeof value.then === "function") {
    return await value;
  }
  return value;
};

export const getBaseUrl = async () => {
  if (typeof window !== "undefined") {
    return "";
  }

  try {
    const incoming = await resolveMaybePromise(headers());
    const host = typeof incoming?.get === "function" ? incoming.get("host") : incoming?.host;
    if (host) {
      const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
      return `${protocol}://${host}`;
    }
  } catch (error) {
    console.warn("getBaseUrl: falling back to NEXT_PUBLIC_APP_URL", error);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  return "http://localhost:3000";
};
