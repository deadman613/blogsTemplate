import Link from "next/link";
import DeleteBlogButton from "@/components/DeleteBlogButton";
import prisma from "@/lib/prisma";

const fetchBlogs = async () =>
  prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

export default async function AdminBlogPage() {
  let blogs = [];
  try {
    blogs = await fetchBlogs();
  } catch (error) {
    console.error(error);
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <p className="eyebrow">Content Hub</p>
          <h1>Blogs</h1>
          <p>Manage every article powering your multi-site deployments from a single dashboard.</p>
        </div>
        <Link href="/admin/blog/create" className="btn btn--primary">
          + New Post
        </Link>
      </header>

      {blogs.length ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id}>
                <td>
                  <p className="admin-table__title">{blog.title}</p>
                  <p className="admin-table__meta">{formatDate(blog.createdAt)}</p>
                </td>
                <td>{blog.tags?.length ? blog.tags.join(", ") : "—"}</td>
                <td className="admin-table__actions">
                  <Link href={`/blog/${blog.slug}`} className="btn btn--ghost" target="_blank" rel="noreferrer">
                    View
                  </Link>
                  <Link href={`/admin/blog/edit/${blog.id}`} className="btn">
                    Edit
                  </Link>
                  <DeleteBlogButton id={blog.id} title={blog.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No posts yet. Click “+ New Post” to publish your first article.</p>
      )}
    </section>
  );
}
