import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="hero" role="main">
      <div className="hero__inner">
        <p className="eyebrow">Reusable Blog Platform</p>
        <h1>Clone once, customize fast.</h1>
        <p>
          A production-ready Next.js 14 template with Prisma, PostgreSQL, TipTap editor, and a complete
          admin console. Copy this base for each client project and only swap brand-specific colors,
          typography, or landing pages.
        </p>
        <div className="hero__actions">
          <Link href="/blog" className="btn btn--primary">
            View Blog
          </Link>
          <Link href="/admin/blog" className="btn">
            Go to Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
