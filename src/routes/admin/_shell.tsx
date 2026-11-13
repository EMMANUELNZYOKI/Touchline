"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  Settings,
  UserSquare2,
  UserCog,
  Users,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LoadingBlock } from "@/components/DataCards";
import { AcademyReadOnlyNotice } from "@/components/AcademyReadOnlyNotice";
import { useAuth } from "@/lib/auth";
import { fetchMyAcademyProfile } from "@/lib/api";

const items: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Coaches", to: "/admin/coaches", icon: Users },
  { label: "Players", to: "/admin/players", icon: UserSquare2 },
  { label: "Evaluations", to: "/admin/evaluations", icon: ClipboardCheck },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Activity", to: "/admin/activity", icon: Activity },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { profile, loading, role } = useAuth();
  const router = useRouter();
  const academyQuery = useQuery({
    queryKey: ["my-academy-profile"],
    queryFn: fetchMyAcademyProfile,
    enabled: role === "academy_admin" || role === "academy_manager",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (loading) return;
    if (!role) router.replace("/admin/login");
    else if (role !== "academy_admin" && role !== "academy_manager")
      router.replace("/coach/dashboard");
  }, [loading, role, router]);

  if (loading || (role !== "academy_admin" && role !== "academy_manager")) return <LoadingBlock />;
  return (
    <AppShell
      items={
        role === "academy_admin"
          ? [
              items[0],
              { label: "Managers", to: "/admin/managers", icon: UserCog },
              ...items.slice(1),
              { label: "Settings", to: "/admin/settings", icon: Settings },
            ]
          : items
      }
      areaLabel={role === "academy_admin" ? "Academy Owner" : "Academy Manager"}
      userName={
        profile?.full_name || (role === "academy_admin" ? "Academy Owner" : "Academy Manager")
      }
      academyName={academyQuery.data?.name}
      signOutTo={role === "academy_manager" ? "/manager/login" : "/admin/login"}
    >
      <AcademyReadOnlyNotice userId={profile?.id} />
      {children}
    </AppShell>
  );
}
