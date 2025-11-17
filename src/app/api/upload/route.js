import { NextResponse } from "next/server";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { ensureAdminApi } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-info";

const ensureDir = async (dirPath) => {
  await mkdir(dirPath, { recursive: true });
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export async function POST(request) {
  try {
    const session = await ensureAdminApi(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }

    const originalName = file.name || "upload.bin";
    const extension = path.extname(originalName).toLowerCase();
    if (extension && !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await ensureDir(uploadsDir);
    const sanitizedName = originalName.replace(/[^a-z0-9.\-]/gi, "_");
    const fileName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const ip = await getClientIp(request);
    await recordAudit("upload.image", {
      actor: session.sub,
      entity: "Upload",
      entityId: fileName,
      ip,
      metadata: {
        originalName,
        size: file.size,
        type: file.type,
      },
    });

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (error) {
    console.error("POST /api/upload failed", error);
    return NextResponse.json({ error: "Unable to upload image" }, { status: 500 });
  }
}
