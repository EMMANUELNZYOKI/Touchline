"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { toast } from "sonner";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { signInWithRoleCheck } from "@/lib/auth";

const title = "Academy Manager Login | Touchline";
const description =
  "Academy managers sign in to manage daily academy operations, players, coaches, evaluations, reports, and activity history.";

export const Route = createFileRoute("/manager/login")({
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
  component: ManagerLogin,
});

function ManagerLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithRoleCheck(email, password, "academy_manager");
      toast.success("Welcome back, academy manager");
      await navigate({ to: "/admin/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Academy operations"
      title="Academy Manager Login"
      description="Use the credentials given to you by the Academy Owner. Manage daily academy operations without access to billing, branding, or owner settings."
      forgotPasswordHref="/forgot-password"
      footer="Academy Owner? Use the Academy Owner Login page instead."
    >
      <CredentialsForm
        submitLabel="Sign in as Academy Manager"
        loading={loading}
        onSubmit={handleSignIn}
      />
    </AuthShell>
  );
}

export default Route.component;
