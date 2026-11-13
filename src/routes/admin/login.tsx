"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { toast } from "sonner";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { signInWithRoleCheck } from "@/lib/auth";

const title = "Academy Owner or Manager Login | Touchline";
const description =
  "Owners and managers sign in to run their academy's players, coaches, evaluations, and reports.";

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
      toast.success("Welcome back, academy owner or manager");
      await navigate({ to: "/admin/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Academy workspace"
      title="Academy Owner or Manager Login"
      description="Owners manage settings, billing, branding, and managers. Managers run day-to-day academy operations."
      footer="Coach? Use the Coach Login page instead."
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
