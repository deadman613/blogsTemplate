import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import { getBaseUrl } from "@/lib/base-url";
import "@/styles/blog.css";

const fetchBlogs = async (searchParams) => {
  const baseUrl = await getBaseUrl();
  const queryString = new URLSearchParams(searchParams).toString();
  const separator = queryString ? "?" : "";
  const res = await fetch(`${baseUrl}/api/blog${separator}${queryString}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }

  return res.json();
};

export const metadata = {
  title: "Blog",
  description: "Latest posts across every site using this shared template.",
};

export default async function BlogPage({ searchParams }) {
  const params = (await searchParams) || {};
  const resolvedParams = { ...params };
  const page = Number(resolvedParams.page) || 1;
  const searchQuery = resolvedParams.search || "";

  let data;
  try {
    data = await fetchBlogs({ ...resolvedParams, page });
  } catch (error) {
    console.error(error);
    data = { data: [], pagination: { page: 1, totalPages: 1, limit: 0, total: 0 } };
  }

  return (
    <main id="main-content" className="blog-index" role="main">
      <header className="blog-index__hero">
        <div>
          <p className="eyebrow">Stories & Updates</p>
          <h1>Blog</h1>
          <p>Search by title, keywords, or tags. Everything is backed by Prisma and PostgreSQL.</p>
        </div>
        <Link href="/admin/blog/create" className="btn btn--ghost">
          + New Post
        </Link>
      </header>

      <form className="blog-search" action="/blog" method="GET" role="search" aria-label="Blog search">
        <input
          type="search"
          name="search"
          placeholder="Search title, content, or tags"
          defaultValue={searchQuery}
          aria-label="Search blog posts"
        />
        <button type="submit">Search</button>
      </form>

      {data?.data?.length ? (
        <div className="blog-grid">
          {data.data.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <p className="empty">No posts yet. Head to the admin area to create one.</p>
      )}

      {data?.pagination?.totalPages > 1 && (
        <nav className="pagination">
          {Array.from({ length: data.pagination.totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === data.pagination.page;
            const paramsClone = new URLSearchParams(resolvedParams);
            paramsClone.set("page", pageNumber.toString());

            return (
              <Link key={pageNumber} href={`/blog?${paramsClone.toString()}`} aria-current={isActive ? "page" : undefined}>
                {pageNumber}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}
