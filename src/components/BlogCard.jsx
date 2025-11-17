import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";

const hasLocalAsset = (src) => {
  if (!src || !src.startsWith("/")) {
    return true;
  }
  try {
    const normalized = src.startsWith("/") ? src.slice(1) : src;
    const filePath = path.join(process.cwd(), "public", normalized);
    return fs.existsSync(filePath);
  } catch (error) {
    console.warn("hasLocalAsset: fallback to placeholder", error);
    return false;
  }
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

const toExcerpt = (html) => {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > 160 ? `${text.slice(0, 160)}...` : text;
};

const BlogCard = ({ blog }) => {
  if (!blog) return null;
  const rawCover = blog.coverImg?.trim();
  const isExternalCover = Boolean(rawCover && /^(https?:)?\/\//i.test(rawCover));
  const isRealCover = Boolean(rawCover) && hasLocalAsset(rawCover);
  const cover = isRealCover ? rawCover : "/placeholder.svg";

  return (
    <article className="blog-card">
      <Link
        href={`/blog/${blog.slug}`}
        className={`blog-card__image${isRealCover ? "" : " blog-card__image--placeholder"}`}
        aria-label={`Read ${blog.title}`}
      >
        <Image
          src={cover}
          alt={blog.title}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 320px, 360px"
          priority={false}
          style={{ objectFit: "cover" }}
          unoptimized={isExternalCover}
        />
        {!isRealCover ? <span>Upload a custom cover to replace the default graphic.</span> : null}
      </Link>
      <div className="blog-card__body">
        <div className="blog-card__meta">
          <span>{formatDate(blog.createdAt)}</span>
          <span>&bull;</span>
          <span>{blog.tags?.slice(0, 2).join(" • ") || "General"}</span>
        </div>
        <h3>
          <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
        </h3>
        <p>{toExcerpt(blog.content)}</p>
        <Link href={`/blog/${blog.slug}`} className="blog-card__cta">
          Continue reading →
        </Link>
      </div>
    </article>
  );
};

export default BlogCard;
