import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  ClipboardCheck,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRole } from "@/lib/api";
import { AppShell, type NavItem } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { LoadingBlock } from "@/components/DataCards";

const items: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Coaches", to: "/admin/coaches", icon: Users },
  { label: "Players", to: "/admin/players", icon: UserSquare2 },
  { label: "Evaluations", to: "/admin/evaluations", icon: ClipboardCheck },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Activity", to: "/admin/activity", icon: Activity },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const Route = createFileRoute("/admin/_shell")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/login" });
    const role = await fetchMyRole(data.user.id);
    if (role !== "academy_admin") throw redirect({ to: "/coach/dashboard" });
    return { userId: data.user.id };
  },
  component: AdminShell,
});

function AdminShell() {
  const { profile, loading } = useAuth();
  return (
    <AppShell
      items={items}
      areaLabel="Academy Admin"
      userName={profile?.full_name || "Academy Admin"}
    >
      {loading && !profile ? <LoadingBlock /> : <Outlet />}
    </AppShell>
  );
}
