"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/next-server-fn";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { createCoachAccount } from "@/lib/admin.functions";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useAuth } from "@/lib/auth";
import { isPackageLimitError } from "@/lib/package-limits";

export const Route = createFileRoute("/admin/_shell/coaches/create")({
  head: () => ({ meta: [{ title: "Create Coach Account | Touchline" }] }),
  component: CreateCoachPage,
});

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CreateCoachPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createCoach = useServerFn(createCoachAccount);
  const { profile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Temporary password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await createCoach({
        data: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        },
      });
      toast.success("Coach account created successfully.");
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      navigate({ to: "/admin/coaches" });
    } catch (error) {
      if (isPackageLimitError(error, "coaches")) {
        toast.error(
          "Your package coach limit has been reached. Choose a larger package to continue.",
        );
        setUpgradeOpen(true);
      } else {
        toast.error(error instanceof Error ? error.message : "Could not create the coach account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setPasswordCopied(true);
      toast.success("Temporary password copied. You can now send it to the coach.");
      window.setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      toast.error("Could not copy the password. Select it and copy it manually.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} profile={profile} />
      <Link
        to="/admin/coaches"
        className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to coaches
      </Link>

      <Card className="bg-gradient-panel border-border/70 shadow-elevated">
        <CardHeader>
          <span className="bg-primary/15 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <CardTitle className="font-display mt-3 text-2xl tracking-wide uppercase">
            Create coach account
          </CardTitle>
          <CardDescription>
            The coach signs in with the email and temporary password you set here. Share the
            credentials with them directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Otieno"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@academy.example"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                maxLength={40}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Temporary password</Label>
              <div className="flex gap-2">
                <PasswordInput
                  id="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPassword(randomPassword())}
                >
                  Generate
                </Button>
                <Button type="button" variant="outline" onClick={() => void copyPassword()}>
                  {passwordCopied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {passwordCopied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Minimum 8 characters. The coach should change it after first sign-in.
              </p>
            </div>
            <Button
              type="submit"
              className="mt-2 h-12 tracking-widest uppercase"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Coach Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Route.component;
