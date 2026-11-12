"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ClipboardCheck,
  LockKeyhole,
  Pencil,
  Power,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingBlock } from "@/components/DataCards";
import {
  fetchAdminActivity,
  fetchEvaluations,
  fetchMyAcademyEntitlements,
  fetchPlayers,
} from "@/lib/api";

export const Route = createFileRoute("/admin/_shell/activity")({
  head: () => ({ meta: [{ title: "Academy Activity | Touchline" }] }),
  component: AdminActivityPage,
});

interface Entry {
  id: string;
  kind: "player" | "evaluation";
  title: string;
  detail: string;
  at: string;
  playerId: string;
}

function AdminActivityPage() {
  const entitlementsQuery = useQuery({
    queryKey: ["academy-entitlements"],
    queryFn: fetchMyAcademyEntitlements,
  });
  const activityEnabled = entitlementsQuery.data?.features.includes("activity_history") ?? false;
  const playersQuery = useQuery({
    queryKey: ["players", "all"],
    queryFn: () => fetchPlayers(),
    enabled: activityEnabled,
  });
  const evalsQuery = useQuery({
    queryKey: ["evaluations"],
    queryFn: fetchEvaluations,
    enabled: activityEnabled,
  });
  const adminActivityQuery = useQuery({
    queryKey: ["admin-activity"],
    queryFn: fetchAdminActivity,
    enabled: activityEnabled,
  });

  if (
    entitlementsQuery.isLoading ||
    (activityEnabled &&
      (playersQuery.isLoading || evalsQuery.isLoading || adminActivityQuery.isLoading))
  ) {
    return <LoadingBlock label="Checking package access…" />;
  }
  if (!activityEnabled) {
    return (
      <EmptyState
        icon={LockKeyhole}
        title="Activity history is available on Growth"
        description="Upgrade to Growth or Pro to unlock admin actions, registrations, and evaluation history."
      />
    );
  }

  const entries: Entry[] = [
    ...(playersQuery.data ?? []).map<Entry>((p) => ({
      id: `player-${p.id}`,
      kind: "player",
      title: `${p.first_name} ${p.last_name} was registered`,
      detail: `${p.position ?? "No position"} · by ${p.coachName}`,
      at: p.created_at,
      playerId: p.id,
    })),
    ...(evalsQuery.data ?? []).map<Entry>((e) => ({
      id: `eval-${e.id}`,
      kind: "evaluation",
      title: `${e.playerName} was evaluated`,
      detail: `Overall ${e.overall_rating?.toFixed(1) ?? "—"}/10 · by ${e.coachName}`,
      at: e.created_at,
      playerId: e.player_id,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">Activity</h1>
        <p className="text-muted-foreground text-sm">
          Admin actions, registrations, and evaluations
        </p>
      </div>

      {(adminActivityQuery.data ?? []).length > 0 && (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Super Admin actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
            {(adminActivityQuery.data ?? []).map((entry) => {
              const icon =
                entry.action === "player_updated" ? (
                  <Pencil className="h-4 w-4" />
                ) : entry.action === "player_deleted" ? (
                  <Trash2 className="h-4 w-4" />
                ) : entry.action === "coach_status_changed" ? (
                  <Power className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                );
              const content = (
                <>
                  <span className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.summary}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {entry.entity_type === "player" ? "Player record" : "Coach account"}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </>
              );

              return entry.entity_type === "player" ? (
                <Link
                  key={entry.id}
                  to="/admin/players/$playerId"
                  params={{ playerId: entry.entity_id }}
                  className="hover:bg-muted/40 flex items-start gap-3 rounded-lg px-3 py-3 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div key={entry.id} className="flex items-start gap-3 rounded-lg px-3 py-3">
                  {content}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Registrations and evaluations by your coaches show up here in real time."
        />
      ) : (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
            {entries.slice(0, 50).map((entry) => (
              <Link
                key={entry.id}
                to="/admin/players/$playerId"
                params={{ playerId: entry.playerId }}
                className="hover:bg-muted/40 flex items-start gap-3 rounded-lg px-3 py-3 transition-colors"
              >
                <span
                  className={
                    entry.kind === "player"
                      ? "bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      : "bg-accent/15 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  }
                >
                  {entry.kind === "player" ? (
                    <UserPlus className="h-4 w-4" />
                  ) : (
                    <ClipboardCheck className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.title}</p>
                  <p className="text-muted-foreground truncate text-xs">{entry.detail}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(entry.at).toLocaleString()}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Route.component;
