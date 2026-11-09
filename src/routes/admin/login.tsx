import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthShell, CredentialsForm } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithRoleCheck } from "@/lib/auth";
import { bootstrapSuperAdmin, superAdminExists } from "@/lib/admin.functions";

const title = "Super Admin Login | Dios Soccer Academy";
const description =
  "Secure Super Admin access to the Dios Soccer Academy player evaluation and coach management portal.";

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
  const checkExists = useServerFn(superAdminExists);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["super-admin-exists"],
    queryFn: () => checkExists(),
  });

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithRoleCheck(email, password, "super_admin");
      toast.success("Welcome back, Super Admin");
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AuthShell badge="Administration" title="Super Admin Login" description="Checking academy setup…">
        <div className="flex justify-center py-6">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (data && !data.exists) {
    return <BootstrapForm onDone={() => refetch()} />;
  }

  return (
    <AuthShell
      badge="Administration"
      title="Super Admin Login"
      description="Full control of coaches, players and evaluations."
      footer="Coach? Use the Coach Sign In page instead."
    >
      <CredentialsForm submitLabel="Sign in as Super Admin" loading={loading} onSubmit={handleSignIn} />
    </AuthShell>
  );
}

function BootstrapForm({ onDone }: { onDone: () => void }) {
  const bootstrap = useServerFn(bootstrapSuperAdmin);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bootstrap({
        data: { full_name: fullName.trim(), email: email.trim(), password },
      });
      toast.success("Super Admin account created. You can now sign in.");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="One-time setup"
      title="Create Super Admin"
      description="No Super Admin exists yet for this academy. Create the single administrator account to begin. This screen disappears permanently afterwards."
    >
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            required
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Academy Director"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bs-email">Email address</Label>
          <Input
            id="bs-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bs-password">Password (min 8 characters)</Label>
          <Input
            id="bs-password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="mt-2 h-12 tracking-widest uppercase" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Super Admin
        </Button>
      </form>
    </AuthShell>
  );
}
