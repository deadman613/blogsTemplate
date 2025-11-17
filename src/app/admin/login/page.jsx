import AdminLoginForm from "@/components/AdminLoginForm";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import "@/styles/admin.css";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/blog");
  }

  return (
    <main id="main-content" className="auth-page" role="main">
      <div className="auth-card">
        <div className="auth-card__brand">
          <p className="auth-card__eyebrow">Control Center</p>
          <h1>Content Admin Portal</h1>
          <p>
            Sign in with your operator credentials to publish, revise, and deploy content across every brand that
            shares this template.
          </p>
          <ul className="auth-card__list">
            <li>Secure session-based access with audit-ready logging.</li>
            <li>Consistent publishing workflow powered by Prisma.</li>
            <li>Responsive admin surface crafted for focused writing.</li>
          </ul>
        </div>
        <div className="auth-card__form">
          <AdminLoginForm />
          <p className="auth-form__hint">
            <Link href="/">← Back to site</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
