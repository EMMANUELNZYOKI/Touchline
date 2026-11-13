"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { toast } from "sonner";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { signInWithRoleCheck } from "@/lib/auth";

const title = "Coach Login | Touchline";
const description =
  "Coaches sign in to register players, complete evaluations and track development at Touchline.";

export const Route = createFileRoute("/coach/login")({
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
  component: CoachLogin,
});

function CoachLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { role } = await signInWithRoleCheck(email, password, "any");
      toast.success("Signed in successfully");
      navigate({
        to:
          role === "academy_admin" || role === "academy_manager"
            ? "/admin/dashboard"
            : "/coach/dashboard",
        replace: true,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Coaching Staff"
      title="Coach Login"
      description="Use the credentials issued to you by your Academy Owner or Academy Manager."
      footer="Coach accounts are created by academy staff. Contact your academy office if you cannot sign in."
    >
      <CredentialsForm submitLabel="Sign in as Coach" loading={loading} onSubmit={handleSignIn} />
    </AuthShell>
  );
}

export default Route.component;
