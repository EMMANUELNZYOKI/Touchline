"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { AppShell, type NavItem } from "@/components/AppShell";
import { LoadingBlock } from "@/components/DataCards";
import { supabase } from "@/integrations/supabase/client";

const items: NavItem[] = [{ label: "Academies", to: "/platform/dashboard", icon: LayoutDashboard }];

export function PlatformShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Platform Admin");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    const verify = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (active) {
          setAuthorized(false);
          setLoading(false);
          router.replace("/platform/login");
        }
        return;
      }
      const { data: platformAdmin, error: roleError } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (active) {
        if (roleError || !platformAdmin) {
          setAuthorized(false);
          router.replace("/platform/login");
        } else {
          const metadataName = data.user.user_metadata?.["full_name"];
          setUserName(
            typeof metadataName === "string" ? metadataName : data.user.email || "Platform Admin",
          );
          setAuthorized(true);
        }
        setLoading(false);
      }
    };
    void verify();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !authorized) return <LoadingBlock />;
  return (
    <AppShell
      items={items}
      areaLabel="Touchline Platform"
      userName={userName}
      signOutTo="/platform/login"
    >
      <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" /> Platform-wide controls are restricted to
        authorized Touchline operators.
      </div>
      {children}
    </AppShell>
  );
}
