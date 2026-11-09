import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck, Mail, Phone, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingBlock } from "@/components/DataCards";
import { fetchCoachProfile } from "@/lib/api";

export const Route = createFileRoute("/admin/_shell/coaches/$coachId")({
  head: () => ({ meta: [{ title: "Coach Profile | Dios Soccer Academy" }] }),
  component: CoachProfilePage,
});

function CoachProfilePage() {
  const { coachId } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["coach", coachId],
    queryFn: () => fetchCoachProfile(coachId),
  });

  if (isLoading) return <LoadingBlock label="Loading coach profile…" />;

  if (isError || !data) {
    return (
      <div className="grid gap-4">
        <Link
          to="/admin/coaches"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to coaches
        </Link>
        <p className="text-muted-foreground">This coach could not be found.</p>
      </div>
    );
  }

  const { coach, evaluatedPlayers, evaluatedPlayerIds, evaluations } = data;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/coaches"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to coaches
        </Link>
        <Badge
          className={
            coach.is_active
              ? "border-accent/30 bg-accent/15 text-accent"
              : "border-destructive/30 bg-destructive/15 text-destructive"
          }
        >
          {coach.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div>
        <p className="text-muted-foreground text-sm tracking-widest uppercase">Coach profile</p>
        <h1 className="font-display mt-1 text-3xl tracking-wide uppercase">
          {coach.full_name || "Unnamed coach"}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={Users} label="Players evaluated" value={evaluatedPlayerIds.length} />
        <StatCard icon={ClipboardCheck} label="Total evaluations" value={evaluations.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <DetailRow label="Coach name" value={coach.full_name || "—"} />
            <DetailRow
              label="Email"
              value={coach.email}
              icon={<Mail className="h-4 w-4" />}
            />
            <DetailRow
              label="Phone"
              value={coach.phone || "Not provided"}
              icon={<Phone className="h-4 w-4" />}
            />
            <DetailRow label="Account status" value={coach.is_active ? "Active" : "Inactive"} />
            <DetailRow
              label="Date created"
              value={new Date(coach.created_at).toLocaleDateString()}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Players evaluated</CardTitle>
          </CardHeader>
          <CardContent>
            {evaluatedPlayers.length === 0 ? (
              <p className="text-muted-foreground text-sm">This coach has not evaluated any players yet.</p>
            ) : (
              <div className="grid gap-2">
                {evaluatedPlayers.map((player) => (
                  <Link
                    key={player.id}
                    to="/admin/players/$playerId"
                    params={{ playerId: player.id }}
                    className="border-border/70 hover:bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition"
                  >
                    <span>
                      <span className="block font-medium">
                        {player.first_name} {player.last_name}
                      </span>
                      <span className="text-muted-foreground text-xs">{player.position || "Position not set"}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">View player</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Recent evaluation activity</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No evaluation activity recorded yet.</p>
          ) : (
            <div className="grid gap-3">
              {evaluations.slice(0, 10).map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{evaluation.playerName}</p>
                    <p className="text-muted-foreground text-xs">
                      {evaluation.season} {evaluation.season_year} · {new Date(evaluation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {evaluation.overall_rating === null || evaluation.overall_rating === undefined
                      ? "Rating not recorded"
                      : `Overall ${evaluation.overall_rating}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-center gap-3 p-5">
        <span className="bg-primary/10 text-primary rounded-lg p-2">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="text-muted-foreground block text-xs uppercase">{label}</span>
          <span className="font-display text-2xl">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="border-border/60 flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right font-medium">
        {icon}
        {value}
      </span>
    </div>
  );
}
