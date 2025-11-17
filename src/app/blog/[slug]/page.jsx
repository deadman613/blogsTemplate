import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/base-url";
import "@/styles/blog.css";

const fetchBlog = async (slug) => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/blog/${slug}`, {
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch blog");
  }

  return res.json();
};

const fetchRelated = async (slug) => {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/blog?relatedTo=${slug}&limit=3`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return { data: [] };
  return res.json();
};

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

export async function generateMetadata(props) {
  const params = await props?.params;
  const slug = params?.slug;
  const blog = slug ? await fetchBlog(slug) : null;

  if (!blog) {
    return {
      title: "Post Not Found",
    };
  }

  const baseUrl = await getBaseUrl();
  const description = blog.content.replace(/<[^>]+>/g, " ").slice(0, 150);
  const image = blog.coverImg ? new URL(blog.coverImg, baseUrl).toString() : undefined;
  const canonical = new URL(`/blog/${blog.slug}`, baseUrl).toString();

  return {
    title: blog.title,
    description,
    openGraph: {
      title: blog.title,
      description,
      images: image ? [image] : undefined,
      type: "article",
      url: canonical,
    },
    alternates: { canonical },
  };
}

export default async function BlogDetails(props) {
  const params = await props?.params;
  const slug = params?.slug;
  const blog = slug ? await fetchBlog(slug) : null;

  if (!blog) {
    notFound();
  }

  const related = await fetchRelated(slug);
  const cover = blog.coverImg?.trim();
  const isExternalCover = Boolean(cover && /^(https?:)?\/\//i.test(cover));
  const isRealCover = Boolean(cover) && hasLocalAsset(cover);
  const imageSrc = isRealCover ? cover : "/placeholder.svg";
  const isPlaceholder = !isRealCover;
  const baseUrl = await getBaseUrl();
  const canonical = `${baseUrl}/blog/${blog.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    url: canonical,
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt ?? blog.createdAt,
    author: {
      "@type": "Person",
      name: "Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Blogcode",
    },
    image: isRealCover ? new URL(imageSrc, baseUrl).toString() : undefined,
    description: blog.content.replace(/<[^>]+>/g, " ").slice(0, 160),
  };

  return (
    <main id="main-content" className="blog-detail" role="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article aria-labelledby="blog-title">
        <header>
          <p className="eyebrow">{new Date(blog.createdAt).toLocaleDateString()}</p>
          <h1 id="blog-title">{blog.title}</h1>
          {blog.tags?.length ? <p className="tags">{blog.tags.join(" / ")}</p> : null}
        </header>

        <div className={`cover${isPlaceholder ? " cover--placeholder" : ""}`}>
          <Image
            src={imageSrc}
            alt={blog.title}
            fill
            sizes="(max-width: 900px) 100vw, 840px"
            priority
            style={{ objectFit: "cover" }}
            unoptimized={isExternalCover}
          />
          {isPlaceholder ? <span className="cover__hint">Upload a cover image from the admin panel to replace this default artwork.</span> : null}
        </div>

        <div className="content" dangerouslySetInnerHTML={{ __html: blog.content }} />

        {related?.data?.length ? (
          <aside className="related">
            <h3>Related Posts</h3>
            <ul>
              {related.data.map((item) => (
                <li key={item.id}>
                  <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </article>
    </main>
  );
}
