import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ClipboardList,
  Target,
  Brain,
  Activity,
  HeartHandshake,
  Trophy,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroPitch from "@/assets/hero-pitch.jpg";

const title = "Dios Soccer Academy | Player Evaluation & Development Portal";
const description =
  "The official Dios Soccer Academy portal for coaches to register players, complete evaluations, monitor development and maintain accurate player records.";

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

const pillars = [
  {
    icon: Target,
    title: "Technical Evaluation",
    body: "Ball control, dribbling, passing, first touch, shooting, crossing, finishing and ball protection scored on a 1–10 scale.",
  },
  {
    icon: Brain,
    title: "Tactical Evaluation",
    body: "Positioning, decision making, game awareness, movement, defensive duties, teamwork and understanding of space.",
  },
  {
    icon: Activity,
    title: "Physical Evaluation",
    body: "Speed, agility, strength, stamina, balance and coordination tracked through every development cycle.",
  },
  {
    icon: HeartHandshake,
    title: "Personality & Discipline",
    body: "Discipline, attitude, confidence, leadership, team spirit, coachability and commitment to the badge.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-gold flex h-9 w-9 items-center justify-center rounded-xl">
              <Trophy className="text-primary-foreground h-4 w-4" />
            </span>
            <span className="font-display text-sm tracking-[0.2em] uppercase sm:text-base">
              Dios Soccer Academy
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a
              href="#development"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Development
            </a>
            <a
              href="#evaluation"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Evaluation
            </a>
            <a
              href="#contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <img
          src={heroPitch}
          alt="Floodlit football pitch at Dios Soccer Academy"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="bg-gradient-hero absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="border-primary/40 bg-primary/10 text-primary inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase">
            Official Coaching Portal
          </p>
          <h1 className="font-display mt-6 text-4xl leading-[1.05] tracking-wide uppercase sm:text-6xl lg:text-7xl">
            Dios Soccer <span className="text-gradient-gold">Academy</span>
          </h1>
          <h2 className="font-display text-accent mt-3 text-lg tracking-[0.18em] uppercase sm:text-2xl">
            Player Evaluation &amp; Development Portal
          </h2>
          <p className="text-muted-foreground mt-6 max-w-2xl text-base sm:text-lg">
            “Empowering coaches to identify talent, evaluate performance, and develop the next
            generation of football players.”
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 px-8 text-base tracking-widest uppercase">
              <Link to="/admin/login">
                <ShieldCheck className="mr-1 h-5 w-5" /> Super Admin Login
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-accent/60 text-accent hover:bg-accent/10 hover:text-accent h-14 px-8 text-base tracking-widest uppercase"
            >
              <Link to="/coach/login">
                <ClipboardList className="mr-1 h-5 w-5" /> Coach Sign In
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-5 text-xs">
            Coach accounts are created only by the Super Admin. There is no public registration.
          </p>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
              About the academy
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
              A professional platform built for serious player development
            </h2>
            <p className="text-muted-foreground mt-5 text-sm leading-relaxed sm:text-base">
              Dios Soccer Academy develops disciplined, technically complete footballers. This portal
              gives our coaches one secure place to register players, complete structured
              evaluations, monitor development over time and maintain accurate player records — while
              the academy leadership keeps full oversight of every coach, player and assessment.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Evaluation areas", value: "4" },
                { label: "Skills tracked", value: "28" },
                { label: "Rating scale", value: "1–10" },
              ].map((item) => (
                <div key={item.label} className="border-border/70 bg-card rounded-xl border p-4">
                  <p className="font-display text-gradient-gold text-3xl">{item.value}</p>
                  <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Card id="development" className="bg-gradient-panel border-border/70 shadow-elevated">
            <CardContent className="p-7">
              <h3 className="font-display text-xl tracking-wide uppercase">Player Development</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Every player carries a living development record. Coaches log strengths, weaknesses,
                development goals and a professional verdict after each assessment cycle, so progress
                is visible season after season.
              </p>
              <ul className="mt-6 grid gap-3 text-sm">
                {[
                  "Structured multi-step player registration",
                  "Detailed 1–10 skill ratings across 28 attributes",
                  "Automatic overall rating and category scores",
                  "Full evaluation history per player",
                  "Academy-wide oversight for the Super Admin",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="bg-accent mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="evaluation" className="border-border/60 border-y bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            The evaluation framework
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
            Four pillars of assessment
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="bg-gradient-panel border-border/70 transition-transform hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <span className="bg-primary/15 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
                    <pillar.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display mt-4 text-base tracking-wide uppercase">
                    {pillar.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{pillar.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Contact</p>
            <h2 className="font-display mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
              Get in touch with the academy
            </h2>
            <div className="mt-7 grid gap-4 text-sm">
              <p className="flex items-center gap-3">
                <Mail className="text-primary h-4 w-4" /> info@diossocceracademy.com
              </p>
              <p className="flex items-center gap-3">
                <Phone className="text-primary h-4 w-4" /> +254 748 229 179
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="text-primary h-4 w-4" /> Dios Academy Training Ground, Ruiru, Kiambu County, Kenya
              </p>
            </div>
          </div>
          <Card className="bg-gradient-panel border-border/70 shadow-elevated">
            <CardContent className="p-7">
              <h3 className="font-display text-lg tracking-wide uppercase">Portal access</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Choose your access level to continue.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild className="h-12 tracking-widest uppercase">
                  <Link to="/admin/login">Super Admin Login</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-accent/60 text-accent hover:bg-accent/10 hover:text-accent h-12 tracking-widest uppercase"
                >
                  <Link to="/coach/login">Coach Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-border/60 bg-card/60 border-t py-10">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display tracking-[0.2em] uppercase">
            Dios Soccer Academy · Player Evaluation &amp; Development Portal
          </p>
          <p>© {new Date().getFullYear()} Dios Soccer Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
