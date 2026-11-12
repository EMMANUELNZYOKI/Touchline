"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useEffect, useRef, useState } from "react";

import { useServerFn } from "@/lib/next-server-fn";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { completeAcademyOnboarding } from "@/lib/onboarding.functions";

const title = "Start an Academy Trial | Touchline";
const description =
  "Create your academy workspace and invite coaches to evaluate player development.";

export const Route = createFileRoute("/onboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcademyOnboarding,
});

type PageState = "form" | "sending" | "confirm-email" | "completing" | "failed";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function AcademyOnboarding() {
  const navigate = useNavigate();
  const complete = useServerFn(completeAcademyOnboarding);
  const finishing = useRef(false);
  const [pageState, setPageState] = useState<PageState>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [academyName, setAcademyName] = useState("");
  const [academySlug, setAcademySlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const callback = new URLSearchParams(window.location.search).get("complete") === "1";
    if (!callback) return;
    setPageState("completing");

    const finishFromSession = async (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"],
    ) => {
      if (!session?.user || finishing.current) return;
      finishing.current = true;
      setPageState("completing");
      setErrorMessage("");
      try {
        await complete();
        toast.success("Your academy workspace is ready");
        await navigate({ to: "/admin/dashboard", replace: true });
      } catch (error) {
        finishing.current = false;
        const metadata = session.user.user_metadata;
        setAcademyName(
          typeof metadata["academy_name"] === "string" ? metadata["academy_name"] : "",
        );
        setAcademySlug(
          typeof metadata["academy_slug"] === "string" ? metadata["academy_slug"] : "",
        );
        setSlugEdited(true);
        setFullName(typeof metadata["full_name"] === "string" ? metadata["full_name"] : "");
        setPhone(typeof metadata["phone"] === "string" ? metadata["phone"] : "");
        setEmail(session.user.email ?? "");
        setErrorMessage(error instanceof Error ? error.message : "Could not finish academy setup.");
        setPageState("failed");
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        void finishFromSession(data.session);
      } else {
        setPageState("confirm-email");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") void finishFromSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [complete, navigate]);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }
    if (!academySlug) {
      setErrorMessage("Enter an academy URL using letters, numbers, and hyphens.");
      return;
    }

    setPageState("sending");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (sessionData.session.user.user_metadata["touchline_onboard_pending"] !== true) {
          throw new Error("Sign out of the current account before starting a new academy signup.");
        }
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            academy_name: academyName.trim(),
            academy_slug: academySlug,
            touchline_onboard_pending: true,
          },
        });
        if (updateError) throw updateError;
        await complete();
        toast.success("Your academy workspace is ready");
        await navigate({ to: "/admin/dashboard", replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboard?complete=1`,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            academy_name: academyName.trim(),
            academy_slug: academySlug,
            touchline_onboard_pending: true,
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        await complete();
        toast.success("Your academy workspace is ready");
        await navigate({ to: "/admin/dashboard", replace: true });
        return;
      }

      setPageState("confirm-email");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start academy signup.");
      setPageState("form");
    }
  };

  if (pageState === "completing" || pageState === "sending") {
    return (
      <AuthShell
        badge="Touchline onboarding"
        title={pageState === "sending" ? "Creating your account" : "Finishing setup"}
        description="Your academy workspace and 14-day starter trial are being prepared."
      >
        <div className="flex items-center justify-center gap-3 py-6 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" /> Please keep this page open.
        </div>
      </AuthShell>
    );
  }

  if (pageState === "confirm-email") {
    return (
      <AuthShell
        badge="Verify your email"
        title="Check your inbox"
        description={`We sent a confirmation link to ${email || "your signup email"}. Open it on this device to finish creating your academy workspace.`}
        footer={
          <span>
            Already confirmed?{" "}
            <Link className="text-primary underline" to="/admin/login">
              Sign in
            </Link>
          </span>
        }
      >
        <p className="text-muted-foreground text-sm leading-6">
          The confirmation link returns to Touchline and activates the account that owns this
          academy. If you do not see the email, check your spam folder.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge="14-day starter trial"
      title="Create your academy workspace"
      description="Set up the academy administrator account. You can add coaches and players after verification."
      footer={
        <span>
          Already have an account?{" "}
          <Link className="text-primary underline" to="/admin/login">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="grid gap-4" onSubmit={handleSignup}>
        <div className="grid gap-2">
          <Label htmlFor="academy-name">Academy name</Label>
          <Input
            id="academy-name"
            required
            minLength={2}
            maxLength={160}
            autoComplete="organization"
            value={academyName}
            onChange={(event) => {
              const value = event.target.value;
              setAcademyName(value);
              if (!slugEdited) setAcademySlug(slugify(value));
            }}
            placeholder="Example Soccer Academy"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="academy-slug">Workspace slug</Label>
          <Input
            id="academy-slug"
            required
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            autoComplete="off"
            value={academySlug}
            onChange={(event) => {
              setSlugEdited(true);
              setAcademySlug(slugify(event.target.value));
            }}
            placeholder="example-soccer-academy"
          />
          <p className="text-muted-foreground text-xs">
            Lowercase letters, numbers, and hyphens only. This identifies your workspace; it is not
            a custom web address.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-name">Your full name</Label>
          <Input
            id="admin-name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-phone">Phone (optional)</Label>
          <Input
            id="admin-phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-email">Email address</Label>
          <Input
            id="admin-email"
            type="email"
            required
            maxLength={255}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="director@academy.example"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-password">Password (minimum 8 characters)</Label>
          <PasswordInput
            id="admin-password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <PasswordInput
            id="confirm-password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {(errorMessage || pageState === "failed") && (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage || "Academy setup could not be completed."}
          </p>
        )}
        <Button type="submit" className="mt-1 h-12 gap-2 uppercase">
          Start 14-day trial <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-muted-foreground mt-4 text-xs leading-5">
        Your academy is created only after you confirm your email. This trial setup does not collect
        payment details.
      </p>
    </AuthShell>
  );
}

export default Route.component;
