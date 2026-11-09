"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, History, LayoutDashboard, UserCog, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LoadingBlock } from "@/components/DataCards";
import { AcademyReadOnlyNotice } from "@/components/AcademyReadOnlyNotice";
import { useAuth } from "@/lib/auth";

const items: NavItem[] = [
  { label: "Dashboard", to: "/coach/dashboard", icon: LayoutDashboard },
  { label: "My Players", to: "/coach/players", icon: Users },
  { label: "Evaluations", to: "/coach/evaluations", icon: ClipboardCheck },
  { label: "My History", to: "/coach/history", icon: History },
  { label: "Profile", to: "/coach/profile", icon: UserCog },
];

export function CoachShell({ children }: { children: ReactNode }) {
  const { profile, loading, role } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !role) router.replace("/coach/login");
  }, [loading, role, router]);

  if (loading || !role) return <LoadingBlock />;
  return (
    <AppShell
      items={items}
      areaLabel="Coach"
      userName={profile?.full_name || "Coach"}
      signOutTo="/coach/login"
    >
      <AcademyReadOnlyNotice userId={profile?.id} />
      {children}
    </AppShell>
  );
}
