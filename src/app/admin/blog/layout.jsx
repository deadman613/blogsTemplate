import AdminLayout from "@/components/AdminLayout";
import { requireAdminUser } from "@/lib/auth";

export const metadata = {
  title: {
    default: "Blog Admin",
    template: "%s | Blog Admin",
  },
};

export default async function BlogAdminLayout({ children }) {
  await requireAdminUser();
  return <AdminLayout>{children}</AdminLayout>;
}
