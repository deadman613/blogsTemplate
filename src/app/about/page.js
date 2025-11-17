import "@/styles/blog.css";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main id="main-content" className="blog-index" role="main">
      <header className="blog-index__hero">
        <div>
          <p className="eyebrow">Company</p>
          <h1>About This Template</h1>
          <p>
            Drop in your own story or replace this page entirely. It exists so every clone of this repo ships
            with fully working routing beyond the blog system itself.
          </p>
        </div>
      </header>
    </main>
  );
}
