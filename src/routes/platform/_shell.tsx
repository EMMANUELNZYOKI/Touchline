import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

const items: NavItem[] = [{ label: "Academies", to: "/platform/dashboard", icon: LayoutDashboard }];

export const Route = createFileRoute("/platform/_shell")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/platform/login" });
    const { data: platformAdmin, error: roleError } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (roleError || !platformAdmin) throw redirect({ to: "/platform/login" });
    const metadataName = data.user.user_metadata?.["full_name"];
    const platformUserName =
      typeof metadataName === "string" ? metadataName : data.user.email || "Platform Admin";
    return { platformUserName };
  },
  component: PlatformShell,
});

function PlatformShell() {
  const { platformUserName } = Route.useRouteContext();
  return (
    <AppShell
      items={items}
      areaLabel="Touchline Platform"
      userName={String(platformUserName)}
      signOutTo="/platform/login"
    >
      <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Platform-wide controls are restricted to
        authorized Touchline operators.
      </div>
      <Outlet />
    </AppShell>
  );
}
