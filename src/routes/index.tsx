"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Brain,
  Check,
  ClipboardCheck,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroPitch from "@/assets/hero-pitch.jpg";
import Image from "next/image";

const title = "Touchline | Player development, built around your academy";
const description =
  "A smarter workspace for soccer academies to organize player records, support coaches, and make development progress visible.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: UsersRound,
    title: "One clear player record",
    body: "Keep player details, teams, seasons, and development history together instead of scattered across spreadsheets.",
  },
  {
    icon: ClipboardCheck,
    title: "Consistent coach assessments",
    body: "Give coaches a shared framework for recording technical, tactical, physical, and personal development.",
  },
  {
    icon: BarChart3,
    title: "Progress you can follow",
    body: "Turn evaluations into useful conversations about strengths, next steps, and growth over time.",
  },
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-glow">
        <Image
          src="/touchline-logo.jpeg"
          alt="Touchline logo"
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </span>
      <span
        className={`font-display text-lg font-semibold tracking-[0.12em] uppercase ${light ? "text-white" : "text-foreground"}`}
      >
        Touchline
      </span>
    </span>
  );
}

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Touchline home">
            <Brand />
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="#platform"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Platform
            </a>
            <a
              href="#workflow"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#built-for"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              For academies
            </a>
            <a
              href="#sign-in"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="sm:hidden">
              <a href="#sign-in">Sign in</a>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/onboard">
                Start an academy <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[650px] overflow-hidden sm:min-h-[720px]">
          <img
            src={heroPitch.src}
            alt="A football pitch ready for training"
            width={1920}
            height={1088}
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="bg-gradient-hero absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/90 via-background/65 to-background/15" />
          <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 py-20 sm:min-h-[720px] sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div className="max-w-2xl">
              <div className="border-primary/35 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" /> Player development,
                connected
              </div>
              <h1 className="font-display mt-7 max-w-2xl text-5xl leading-[0.98] tracking-tight uppercase sm:text-6xl lg:text-7xl">
                Better records.
                <br />
                <span className="text-gradient-gold">Better player</span>
                <br />
                development.
              </h1>
              <p className="text-muted-foreground mt-7 max-w-xl text-base leading-7 sm:text-lg">
                Touchline gives soccer academies a focused place to organize player information,
                guide coach evaluations, and keep every development conversation moving forward.
              </p>
              <div
                id="sign-in"
                className="mt-9 flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:flex-wrap"
              >
                <Button asChild size="lg" className="h-13 gap-2 px-5 text-sm sm:text-base">
                  <Link to="/platform/login">
                    <ShieldCheck className="h-4 w-4" /> Super Admin Login
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 h-13 gap-2 px-5 text-sm text-white hover:bg-white/10 hover:text-white sm:text-base"
                >
                  <Link to="/admin/login">
                    <UsersRound className="h-4 w-4" /> Academy Admin Login
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary/50 bg-primary/10 text-primary h-13 gap-2 px-5 text-sm hover:bg-primary/20 sm:text-base"
                >
                  <Link to="/coach/login">
                    <ClipboardCheck className="h-4 w-4" /> Coach Sign In
                  </Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                New academy to Touchline?{" "}
                <Link className="text-primary hover:underline" to="/onboard">
                  Start a free trial
                </Link>
              </p>
              <div className="text-muted-foreground mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm">
                <span className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" /> Player profiles
                </span>
                <span className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" /> Structured evaluations
                </span>
                <span className="flex items-center gap-2">
                  <Check className="text-primary h-4 w-4" /> Development history
                </span>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-[2rem] bg-primary/10 blur-3xl" />
              <Card className="bg-background/90 border-white/15 shadow-elevated relative rotate-1 backdrop-blur-xl">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                        Development snapshot
                      </p>
                      <h2 className="font-display mt-2 text-2xl tracking-wide uppercase">
                        Player progress
                      </h2>
                    </div>
                    <span className="bg-primary/15 text-primary rounded-lg p-2">
                      <Activity className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="border-border/70 mt-7 rounded-xl border bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs">Overall development</p>
                        <p className="font-display mt-1 text-4xl">
                          8.4<span className="text-muted-foreground text-base"> / 10</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                        Season review
                      </span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        ["Technical", 88],
                        ["Tactical", 76],
                        ["Physical", 82],
                        ["Mindset", 91],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span>{Math.round(Number(value) / 10) / 10}</span>
                          </div>
                          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                            <div
                              className="bg-gradient-pitch h-full rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="bg-muted/60 rounded-xl p-4">
                      <p className="text-muted-foreground text-xs">Coach feedback</p>
                      <p className="mt-2 text-sm font-medium">Strong first touch</p>
                    </div>
                    <div className="bg-muted/60 rounded-xl p-4">
                      <p className="text-muted-foreground text-xs">Next focus</p>
                      <p className="mt-2 text-sm font-medium">Scan before receiving</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-5 text-[10px]">
                    Illustrative product preview
                  </p>
                </CardContent>
              </Card>
              <div className="bg-background/90 border-border/70 absolute -bottom-8 -left-10 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-elevated backdrop-blur">
                <span className="bg-primary/15 text-primary rounded-lg p-2">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-semibold">Built for academy teams</span>
                  <span className="text-muted-foreground text-[10px]">
                    Coaches and administrators, together
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
              The platform
            </p>
            <h2 className="font-display mt-4 text-3xl leading-tight tracking-wide uppercase sm:text-5xl">
              A stronger system for the work behind every great player.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl leading-7">
              Spend less time chasing information and more time helping players take their next
              step.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="bg-gradient-panel border-border/70 transition-transform duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-7">
                  <span className="bg-primary/15 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <p className="text-muted-foreground mt-7 text-xs tracking-widest">0{index + 1}</p>
                  <h3 className="font-display mt-2 text-xl tracking-wide uppercase">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-border/60 border-y bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
                A simple rhythm
              </p>
              <h2 className="font-display mt-4 text-3xl tracking-wide uppercase sm:text-5xl">
                From first profile to next-season progress.
              </h2>
              <p className="text-muted-foreground mt-5 max-w-xl leading-7">
                A practical workflow helps your staff build a clearer picture of each player, one
                assessment at a time.
              </p>
              <Button asChild className="mt-8 gap-2">
                <Link to="/coach/login">
                  Coach sign in <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {[
                [
                  "01",
                  "Build the player record",
                  "Capture the essential details in one organized profile.",
                ],
                [
                  "02",
                  "Evaluate with a shared framework",
                  "Record observations across the areas your academy values.",
                ],
                [
                  "03",
                  "Keep the development story",
                  "Use history and coach feedback to inform the next conversation.",
                ],
              ].map(([number, heading, text]) => (
                <div
                  key={number}
                  className="border-border/70 bg-background/70 flex gap-5 rounded-2xl border p-5 sm:p-6"
                >
                  <span className="font-display text-primary text-2xl">{number}</span>
                  <div>
                    <h3 className="font-display tracking-wide uppercase">{heading}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="built-for" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="bg-gradient-panel border-border/70 shadow-elevated relative overflow-hidden rounded-3xl border p-8 sm:p-12 lg:p-16">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative max-w-3xl">
              <span className="bg-primary/15 text-primary inline-flex rounded-lg p-3">
                <Target className="h-5 w-5" />
              </span>
              <p className="text-primary mt-6 text-xs font-semibold tracking-[0.2em] uppercase">
                For soccer academies
              </p>
              <h2 className="font-display mt-3 text-3xl leading-tight tracking-wide uppercase sm:text-5xl">
                Make player development part of your everyday playbook.
              </h2>
              <p className="text-muted-foreground mt-5 max-w-2xl leading-7">
                Bring administrators and coaches into one consistent process—so every player gets
                thoughtful attention and a clearer path forward.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/onboard">
                    Create an academy workspace <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/admin/login">Academy admin sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border/60 border-t bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <Brand />
            <p className="text-muted-foreground mt-2 text-xs">Player development, connected.</p>
          </div>
          <div className="text-muted-foreground flex items-center gap-5 text-xs">
            <a href="#platform" className="hover:text-foreground">
              Platform
            </a>
            <a href="#workflow" className="hover:text-foreground">
              How it works
            </a>
            <Link to="/platform/login" className="hover:text-foreground">
              Platform admin
            </Link>
            <span>© {new Date().getFullYear()} Touchline</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Route.component;
