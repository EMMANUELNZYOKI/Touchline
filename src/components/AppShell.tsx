"use client";

import { Link, useNavigate, useRouterState } from "@/lib/next-router-compat";
import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Menu, X, LogOut, ShieldCheck, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutCompletely } from "@/lib/auth";
import { toast } from "sonner";

export interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppShellProps {
  items: NavItem[];
  areaLabel: string;
  userName: string;
  academyName?: string;
  children: ReactNode;
  signOutTo?: "/platform/login" | "/admin/login" | "/manager/login" | "/coach/login";
}

export function AppShell({
  items,
  areaLabel,
  userName,
  academyName,
  children,
  signOutTo,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin =
    areaLabel === "Academy Owner" ||
    areaLabel === "Academy Manager" ||
    areaLabel === "Academy Admin" ||
    areaLabel === "Touchline Platform";

  const handleSignOut = async () => {
    await signOutCompletely();
    toast.success("Signed out");
    navigate({ to: signOutTo ?? (isAdmin ? "/admin/login" : "/coach/login"), replace: true });
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "tl-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "tl-nav-link-active text-primary"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="tl-app-sidebar hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <BrandBlock areaLabel={areaLabel} isAdmin={isAdmin} />
        <p className="text-muted-foreground mb-3 px-3 text-[10px] font-bold tracking-[0.2em] uppercase">
          Workspace menu
        </p>
        {nav}
        <Button
          variant="outline"
          className="mt-4 w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="tl-app-sidebar animate-in slide-in-from-left absolute inset-y-0 left-0 flex w-[min(19rem,calc(100vw-1rem))] flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-5">
            <div className="mb-2 flex items-start justify-between">
              <BrandBlock areaLabel={areaLabel} isAdmin={isAdmin} />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
            <Button
              variant="outline"
              className="mt-4 w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="tl-app-topbar sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border px-4 py-2 sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="font-display truncate text-base tracking-wide uppercase sm:text-lg">
              Welcome, {userName}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              Signed in to {academyName ?? "Touchline"} · {areaLabel} area
            </p>
          </div>
          <span className="ml-auto hidden rounded-full border border-border/80 bg-background/45 px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
            {areaLabel}
          </span>
        </header>
        <main className="tl-app-content min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function BrandBlock({ areaLabel, isAdmin }: { areaLabel: string; isAdmin: boolean }) {
  return (
    <Link to="/" className="mb-6 flex items-center gap-3">
      <span className="bg-white flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl p-0.5">
        <Image
          src="/touchline-logo.jpeg"
          alt="Touchline logo"
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="min-w-0">
        <span className="font-display block truncate text-sm tracking-widest uppercase">
          Touchline
        </span>
        <span className="text-muted-foreground block truncate text-xs">{areaLabel}</span>
      </span>
    </Link>
  );
}
