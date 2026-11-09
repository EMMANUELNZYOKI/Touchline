import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Users, ClipboardCheck, UserCog, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRole } from "@/lib/api";
import { AppShell, type NavItem } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { LoadingBlock } from "@/components/DataCards";

const items: NavItem[] = [
  { label: "Dashboard", to: "/coach/dashboard", icon: LayoutDashboard },
  { label: "My Players", to: "/coach/players", icon: Users },
  { label: "Evaluations", to: "/coach/evaluations", icon: ClipboardCheck },
  { label: "My History", to: "/coach/history", icon: History },
  { label: "Profile", to: "/coach/profile", icon: UserCog },
];

export const Route = createFileRoute("/coach/_shell")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/coach/login" });
    const role = await fetchMyRole(data.user.id);
    if (!role) throw redirect({ to: "/coach/login" });
    return { userId: data.user.id };
  },
  component: CoachShell,
});

function CoachShell() {
  const { profile, loading } = useAuth();
  return (
    <AppShell items={items} areaLabel="Coach" userName={profile?.full_name || "Coach"}>
      {loading && !profile ? <LoadingBlock /> : <Outlet />}
    </AppShell>
  );
}
