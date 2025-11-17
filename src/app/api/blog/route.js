import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slugify";
import { normalizeTags } from "@/lib/tags";
import { ensureAdminApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-info";

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 24;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limitParam = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(limitParam, 1), MAX_LIMIT);
    const search = searchParams.get("search")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const relatedTo = searchParams.get("relatedTo")?.trim();
    const excludeId = searchParams.get("excludeId")?.trim();

    const filters = [];
    const excludedIds = [];

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ],
      });
    }

    if (tag) {
      filters.push({ tags: { has: tag.toLowerCase() } });
    }

    if (excludeId) {
      excludedIds.push(excludeId);
    }

    if (relatedTo) {
      const reference = await prisma.blog.findUnique({
        where: { slug: relatedTo },
        select: { id: true, tags: true },
      });

      if (reference) {
        const relatedTags = reference.tags?.length ? reference.tags : undefined;
        excludedIds.push(reference.id);
        if (relatedTags) {
          filters.push({ tags: { hasSome: relatedTags } });
        }
      }
    }

    if (excludedIds.length) {
      filters.push({ id: { notIn: excludedIds } });
    }

    const where = filters.length ? { AND: filters } : undefined;

    const skip = (page - 1) * limit;

    const [items, count] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.blog.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / limit)),
      },
    });
  } catch (error) {
    console.error("GET /api/blog failed", error);
    return NextResponse.json({ error: "Unable to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request) {
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

    const finalSlug = await generateUniqueSlug(slug || title);
    const preparedTags = normalizeTags(tags);

    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        content,
        coverImg: coverImg?.trim() || null,
        tags: preparedTags,
        slug: finalSlug,
      },
    });

    const ip = await getClientIp(request);
    await recordAudit("blog.create", {
      actor: session.sub,
      entity: "Blog",
      entityId: blog.id,
      ip,
      metadata: { title: blog.title, slug: blog.slug },
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error("POST /api/blog failed", error);
    return NextResponse.json({ error: "Unable to create blog" }, { status: 500 });
  }
}
