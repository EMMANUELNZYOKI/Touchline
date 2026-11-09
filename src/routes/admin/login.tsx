"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { toast } from "sonner";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { signInWithRoleCheck } from "@/lib/auth";

const title = "Academy Admin Login | Touchline";
const description = "Sign in to manage your soccer academy's coaches, players, and evaluations.";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithRoleCheck(email, password, "academy_admin");
      toast.success("Welcome back, academy administrator");
      await navigate({ to: "/admin/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Academy administration"
      title="Academy Admin Login"
      description="Manage your academy's coaches, players, and evaluations."
      footer="Coach? Use the Coach Sign In page instead."
    >
      <CredentialsForm
        submitLabel="Sign in to your academy"
        loading={loading}
        onSubmit={handleSignIn}
      />
    </AuthShell>
  );
}

export default Route.component;
