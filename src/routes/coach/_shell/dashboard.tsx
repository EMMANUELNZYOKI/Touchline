"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";
import { UserSquare2, ClipboardCheck, Star, CalendarPlus, ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, LoadingBlock, EmptyState } from "@/components/DataCards";
import { RatingBadge } from "@/components/PlayersTable";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { fetchPlayers } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/coach/_shell/dashboard")({
  head: () => ({ meta: [{ title: "Coach Dashboard | Touchline" }] }),
  component: CoachDashboard,
});

function CoachDashboard() {
  const { profile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["players", "all"],
    queryFn: () => fetchPlayers(),
  });

  if (isLoading || !data) return <LoadingBlock label="Loading registered players…" />;

  const players = data;
  const evaluations = players.map((p) => p.evaluation).filter(Boolean);
  const evaluatedPlayers = players.filter((p) => p.hasEvaluation);
  const pendingPlayers = players.filter((p) => !p.hasEvaluation);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const rated = evaluations.filter((e) => e?.overall_rating != null);
  const avgRating = rated.length
    ? Math.round(
        (rated.reduce((sum, e) => sum + (e?.overall_rating ?? 0), 0) / rated.length) * 10,
      ) / 10
    : 0;

  const positionData = Object.entries(
    players.reduce<Record<string, number>>((acc, p) => {
      const key = p.position ?? "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const recent = [...players]
    .sort(
      (a, b) =>
        Number(a.hasEvaluation) - Number(b.hasEvaluation) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">
          Welcome, {profile?.full_name?.split(" ")[0] ?? "Coach"}
        </h1>
        <p className="text-muted-foreground text-sm">Here is how your squad is progressing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Players" value={players.length} icon={UserSquare2} />
        <StatCard label="Awaiting Evaluation" value={pendingPlayers.length} icon={UserSquare2} />
        <StatCard
          label="Players Evaluated"
          value={evaluatedPlayers.length}
          icon={ClipboardCheck}
          tone="accent"
        />
        <StatCard
          label="Average Rating"
          value={avgRating ? `${avgRating}/10` : "—"}
          icon={Star}
          tone="accent"
        />
        <StatCard
          label="Added This Month"
          value={players.filter((p) => p.created_at.slice(0, 7) === thisMonth).length}
          icon={CalendarPlus}
          tone="muted"
        />
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          title="No players registered yet"
          description="Players registered by your Academy Owner or Manager will appear here for evaluation."
          action={
            <Button asChild>
              <Link to="/coach/players">Evaluate players</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="font-display text-base tracking-wide uppercase">
                Squad by position
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positionData}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="font-display text-base tracking-wide uppercase">
                Recently registered
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  to="/coach/players/$playerId"
                  params={{ playerId: p.id }}
                  className="hover:bg-muted/40 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <PlayerAvatar
                    path={p.player_photo}
                    name={`${p.first_name} ${p.last_name}`}
                    className="h-9 w-9 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-muted-foreground text-xs">{p.position ?? "No position"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={p.hasEvaluation ? "default" : "outline"}>
                      {p.hasEvaluation ? "Evaluated" : "Not evaluated"}
                    </Badge>
                    {p.evaluation && <RatingBadge rating={p.evaluation.overall_rating} />}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/coach/players">Evaluate players</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/coach/players">
            Players to evaluate <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default Route.component;
