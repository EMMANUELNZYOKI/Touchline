"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, History, LayoutDashboard, UserCog, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LoadingBlock } from "@/components/DataCards";
import { useAuth } from "@/lib/auth";
import { fetchMyAcademyProfile } from "@/lib/api";

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
  const academyQuery = useQuery({
    queryKey: ["my-academy-profile"],
    queryFn: fetchMyAcademyProfile,
    enabled: role === "coach",
    staleTime: 60_000,
  });
  useEffect(() => {
    if (!loading && !role) router.replace("/coach/login");
  }, [loading, role, router]);

  if (loading || !role) return <LoadingBlock />;
  return (
    <AppShell
      items={items}
      areaLabel="Coach"
      userName={profile?.full_name || "Coach"}
      academyName={academyQuery.data?.name}
      signOutTo="/coach/login"
    >
      {children}
    </AppShell>
  );
}
