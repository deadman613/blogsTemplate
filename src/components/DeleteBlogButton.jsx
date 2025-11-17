"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withAdminCsrf } from "@/lib/client-csrf";

const DeleteBlogButton = ({ id, title }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/blog/${id}`,
        withAdminCsrf({
          method: "DELETE",
        })
      );
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error("Session expired. Please sign in again.");
      }
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete blog");
      }
      router.refresh();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
};

export default DeleteBlogButton;
