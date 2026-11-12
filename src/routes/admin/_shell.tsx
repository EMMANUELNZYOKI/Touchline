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
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { profile, loading, role } = useAuth();
  const router = useRouter();
  const academyQuery = useQuery({
    queryKey: ["my-academy-profile"],
    queryFn: fetchMyAcademyProfile,
    enabled: role === "academy_admin",
    staleTime: 60_000,
  });

  useEffect(() => {
    if (loading) return;
    if (!role) router.replace("/admin/login");
    else if (role !== "academy_admin") router.replace("/coach/dashboard");
  }, [loading, role, router]);

  if (loading || role !== "academy_admin") return <LoadingBlock />;
  return (
    <AppShell
      items={items}
      areaLabel="Academy Admin"
      userName={profile?.full_name || "Academy Admin"}
      academyName={academyQuery.data?.name}
      signOutTo="/admin/login"
    >
      <AcademyReadOnlyNotice userId={profile?.id} />
      {children}
    </AppShell>
  );
}
