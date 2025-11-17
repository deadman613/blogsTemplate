"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { withAdminCsrf } from "@/lib/client-csrf";

const AdminLogoutButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/admin/session",
        withAdminCsrf({
          method: "DELETE",
        })
      );
      if (!response.ok) {
        throw new Error("Unable to sign out. Please retry.");
      }
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to sign out. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn btn--ghost admin-logout" onClick={handleLogout} disabled={loading}>
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
};

export default AdminLogoutButton;
