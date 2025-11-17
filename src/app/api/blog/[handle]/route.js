import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slugify";
import { normalizeTags } from "@/lib/tags";
import { ensureAdminApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-info";

const resolveLookup = async (handle, lookup) => {
  if (lookup === "id") {
    return prisma.blog.findUnique({ where: { id: handle } });
  }

  return prisma.blog.findUnique({ where: { slug: handle } });
};

export async function GET(request, context) {
  const params = await context?.params;
  if (!params) {
    return NextResponse.json({ error: "Missing route params" }, { status: 400 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const lookup = searchParams.get("lookup") === "id" ? "id" : "slug";

    if (lookup === "id" && !(await ensureAdminApi(request, { requireCsrf: false }))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blog = await resolveLookup(params.handle, lookup);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error(`GET /api/blog/${params?.handle ?? "unknown"} failed`, error);
    return NextResponse.json({ error: "Unable to fetch blog" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  const params = await context?.params;
  if (!params) {
    return NextResponse.json({ error: "Missing route params" }, { status: 400 });
  }
  try {
    const session = await ensureAdminApi(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const { title, content, coverImg, tags, slug } = payload;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const exists = await prisma.blog.findUnique({ where: { id: params.handle } });
    if (!exists) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const resolvedSlug = await generateUniqueSlug(slug || title, params.handle);
    const preparedTags = normalizeTags(tags);

    const updated = await prisma.blog.update({
      where: { id: params.handle },
      data: {
        title: title.trim(),
        content,
        coverImg: coverImg?.trim() || null,
        tags: preparedTags,
        slug: resolvedSlug,
      },
    });

    const ip = await getClientIp(request);
    await recordAudit("blog.update", {
      actor: session.sub,
      entity: "Blog",
      entityId: updated.id,
      ip,
      metadata: { title: updated.title, slug: updated.slug },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PUT /api/blog/${params?.handle ?? "unknown"} failed`, error);
    return NextResponse.json({ error: "Unable to update blog" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const params = await context?.params;
  if (!params) {
    return NextResponse.json({ error: "Missing route params" }, { status: 400 });
  }
  try {
    const session = await ensureAdminApi(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.blog.delete({ where: { id: params.handle } });
    const ip = await getClientIp(request);
    await recordAudit("blog.delete", {
      actor: session.sub,
      entity: "Blog",
      entityId: deleted.id,
      ip,
      metadata: { title: deleted.title, slug: deleted.slug },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/blog/${params?.handle ?? "unknown"} failed`, error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to delete blog" }, { status: 500 });
  }
}
