import { headers } from "next/headers";

const resolveMaybePromise = async (value) => {
  if (value && typeof value.then === "function") {
    return await value;
  }
  return value;
};

const readHeader = (source, name) => {
  if (!source || typeof source.get !== "function") {
    return null;
  }
  return source.get(name);
};

export const getClientIp = async (request) => {
  const resolvedRequest = await resolveMaybePromise(request);
  let headerSource = resolvedRequest?.headers;

  if (!headerSource) {
    try {
      const incoming = await headers();
      headerSource = incoming;
    } catch (error) {
      console.warn("getClientIp: unable to access headers", error);
    }
  }

  const forwarded = readHeader(headerSource, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || forwarded;
  }

  const realIp = readHeader(headerSource, "x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
};
