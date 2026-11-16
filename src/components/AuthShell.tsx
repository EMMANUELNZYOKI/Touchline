"use client";

import Image from "next/image";
import { Link } from "@/lib/next-router-compat";
import { useState, type ReactNode } from "react";
import { Activity, ArrowLeft, ClipboardCheck, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  forgotPasswordHref?: string;
}

const workspaceBenefits = [
  { icon: ShieldCheck, text: "One clear player record" },
  { icon: ClipboardCheck, text: "Consistent coach evaluations" },
  { icon: Activity, text: "Progress you can follow" },
];

function TouchlineBrand() {
  return (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="Touchline home">
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-elevated">
        <Image
          src="/touchline-logo.jpeg"
          alt="Touchline logo"
          width={44}
          height={44}
          className="h-full w-full object-cover"
        />
      </span>
      <span>
        <span className="font-display block text-lg font-semibold tracking-[0.12em] uppercase">
          Touchline
        </span>
        <span className="text-muted-foreground block text-[10px] font-semibold tracking-[0.18em] uppercase">
          Player development, connected
        </span>
      </span>
    </Link>
  );
}

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
  forgotPasswordHref,
}: AuthShellProps) {
  return (
    <div className="tl-auth-page">
      <div className="tl-auth-grid mx-auto grid lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)]">
        <section className="tl-auth-story hidden lg:flex" aria-label="About Touchline">
          <TouchlineBrand />
          <div className="max-w-xl py-12">
            <span className="tl-kicker inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold tracking-[0.18em] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for academy teams
            </span>
            <h2 className="font-display mt-7 max-w-lg text-6xl leading-[0.92] tracking-tight uppercase xl:text-7xl">
              Better records.
              <br />
              <span className="text-gradient-gold">Better player</span>
              <br />
              development.
            </h2>
            <p className="text-muted-foreground mt-6 max-w-lg text-base leading-7">
              Keep the player story connected—from the first profile to the next coaching
              conversation.
            </p>
            <div className="mt-9 grid gap-3">
              {workspaceBenefits.map(({ icon: Icon, text }, index) => (
                <div key={text} className="tl-auth-value flex items-center gap-3 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">{text}</span>
                  <span className="text-muted-foreground ml-auto font-display text-sm">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground text-xs tracking-wide">
            A focused workspace for the people who help players grow.
          </p>
        </section>

        <main className="tl-auth-main">
          <div className="w-full max-w-[31rem]">
            <div className="mb-7 flex items-center justify-between gap-4 lg:justify-end">
              <div className="lg:hidden">
                <TouchlineBrand />
              </div>
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-2 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to academy home
              </Link>
            </div>

            <Card className="tl-auth-card border-border/70 shadow-elevated">
              <CardHeader className="space-y-3 p-6 pb-4 sm:p-8 sm:pb-5">
                <span className="tl-kicker mb-1 inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] uppercase">
                  {badge}
                </span>
                <CardTitle className="font-display text-3xl leading-tight tracking-wide uppercase sm:text-4xl">
                  {title}
                </CardTitle>
                <CardDescription className="max-w-md text-sm leading-6">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2 sm:p-8 sm:pt-3">
                {children}
                {forgotPasswordHref && (
                  <Link
                    to={forgotPasswordHref}
                    className="text-primary hover:text-primary/80 mt-5 block text-center text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                )}
              </CardContent>
            </Card>
            {footer && (
              <div className="text-muted-foreground mt-5 px-3 text-center text-xs leading-5">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

interface CredentialsFormProps {
  submitLabel: string;
  loading: boolean;
  onSubmit: (email: string, password: string) => void;
}

export function CredentialsForm({ submitLabel, loading, onSubmit }: CredentialsFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email.trim(), password);
      }}
    >
      <div className="grid gap-2.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@academy.example"
        />
      </div>
      <div className="grid gap-2.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          minLength={6}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="mt-1 h-12 tracking-[0.12em] uppercase" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
