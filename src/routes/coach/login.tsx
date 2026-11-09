import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { signInWithRoleCheck } from "@/lib/auth";

const title = "Coach Sign In | Touchline";
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
        to: role === "academy_admin" ? "/admin/dashboard" : "/coach/dashboard",
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
      title="Coach Sign In"
      description="Use the credentials issued to you by your academy administrator."
      footer="Accounts are created by academy administrators. Contact your academy office if you cannot sign in."
    >
      <CredentialsForm submitLabel="Sign in as Coach" loading={loading} onSubmit={handleSignIn} />
    </AuthShell>
  );
}
