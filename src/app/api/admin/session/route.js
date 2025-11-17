import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  ensureAdminApi,
  setAdminSessionCookie,
  validateAdminCredentials,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-info";

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_ATTEMPT_LIMIT = 5;

export async function POST(request) {
  const ip = await getClientIp(request);
  const isAllowed = rateLimit({
    key: `admin-login:${ip}`,
    limit: LOGIN_ATTEMPT_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!isAllowed) {
    return NextResponse.json({ error: "Too many login attempts. Please try again shortly." }, { status: 429 });
  }

  const { username, password } = await request.json();

  if (!validateAdminCredentials(username, password)) {
    await recordAudit("admin.login.failed", {
      actor: username,
      ip,
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response);
  await recordAudit("admin.login.success", {
    actor: username,
    ip,
  });
  return response;
}

export async function DELETE(request) {
  const session = await ensureAdminApi(request, { requireCsrf: true });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);
  const ip = await getClientIp(request);
  await recordAudit("admin.logout", {
    actor: session.sub,
    ip,
  });
  return response;
}
