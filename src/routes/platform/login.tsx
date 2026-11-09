"use client";

import { createFileRoute, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { useServerFn } from "@/lib/next-server-fn";
import { toast } from "sonner";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { claimInitialPlatformAdmin } from "@/lib/platform.functions";

export const Route = createFileRoute("/platform/login")({
  head: () => ({
    meta: [{ title: "Touchline Platform Admin | Sign in" }, { name: "robots", content: "noindex" }],
  }),
  component: PlatformLogin,
});

function PlatformLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const claimAdmin = useServerFn(claimInitialPlatformAdmin);

  const submit = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const result = await claimAdmin();
      if (!result.authorized) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for Touchline platform administration.");
      }
      toast.success("Signed in to Touchline Platform");
      await navigate({ to: "/platform/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Touchline platform"
      title="Platform administrator"
      description="Manage academy accounts and subscription status across Touchline. This portal is restricted to platform operators."
      footer="Academy administrator or coach? Use your academy sign-in instead."
    >
      <CredentialsForm submitLabel="Sign in to platform" loading={loading} onSubmit={submit} />
    </AuthShell>
  );
}

export default Route.component;
