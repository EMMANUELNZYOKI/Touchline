"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users,
  UserCheck,
  UserSquare2,
  ClipboardCheck,
  CalendarPlus,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, LoadingBlock, EmptyState } from "@/components/DataCards";
import { fetchCoaches, fetchEvaluations, fetchPlayers } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { UpgradeDialog } from "@/components/UpgradeDialog";

export const Route = createFileRoute("/admin/_shell/dashboard")({
  head: () => ({ meta: [{ title: "Academy Admin Dashboard | Touchline" }] }),
  component: AdminDashboard,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function monthKey(date: string) {
  return new Date(date).toISOString().slice(0, 7);
}

function AdminDashboard() {
  const { profile } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const coachesQuery = useQuery({ queryKey: ["coaches"], queryFn: fetchCoaches });
  const playersQuery = useQuery({ queryKey: ["players", "all"], queryFn: () => fetchPlayers() });
  const evaluationsQuery = useQuery({
    queryKey: ["evaluations", "all"],
    queryFn: fetchEvaluations,
  });

  if (coachesQuery.isLoading || playersQuery.isLoading || evaluationsQuery.isLoading)
    return <LoadingBlock />;

  const coaches = coachesQuery.data ?? [];
  const players = playersQuery.data ?? [];
  const evaluations = evaluationsQuery.data ?? [];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const months = Array.from({ length: 6 })
    .map((_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    })
    .map((key) => ({
      month: new Date(`${key}-01`).toLocaleString(undefined, { month: "short" }),
      key,
      players: players.filter((p) => monthKey(p.created_at) === key).length,
      evaluations: evaluations.filter((e) => e && monthKey(e.created_at) === key).length,
    }));

  const byPosition = Object.entries(
    players.reduce<Record<string, number>>((acc, p) => {
      const key = p.position ?? "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const byCoach = coaches
    .map((c) => ({
      name: c.full_name.split(" ")[0] ?? c.full_name,
      players: c.evaluatedPlayerCount,
    }))
    .sort((a, b) => b.players - a.players)
    .slice(0, 8);

  const avgScores = [
    { area: "Technical", score: avg(evaluations.map((e) => e?.technical_score ?? 0)) },
    { area: "Tactical", score: avg(evaluations.map((e) => e?.tactical_score ?? 0)) },
    { area: "Physical", score: avg(evaluations.map((e) => e?.physical_score ?? 0)) },
    { area: "Character", score: avg(evaluations.map((e) => e?.personality_score ?? 0)) },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="font-display text-lg uppercase tracking-wide">
            Grow your academy with Touchline
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose the package that matches your player capacity and unlock more features.
          </p>
        </div>
        <Button onClick={() => setUpgradeOpen(true)} className="shrink-0">
          Upgrade package <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} profile={profile} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Coaches" value={coaches.length} icon={Users} />
        <StatCard
          label="Active Coaches"
          value={coaches.filter((c) => c.is_active).length}
          icon={UserCheck}
          tone="accent"
        />
        <StatCard label="Total Players Registered" value={players.length} icon={UserSquare2} />
        <StatCard
          label="Total Players Evaluated"
          value={players.filter((p) => p.evaluation).length}
          icon={ClipboardCheck}
          tone="accent"
        />
        <StatCard
          label="Total Players Not Evaluated"
          value={players.filter((p) => !p.evaluation).length}
          icon={UserSquare2}
          tone="muted"
        />
        <StatCard
          label="Players This Month"
          value={players.filter((p) => monthKey(p.created_at) === thisMonth).length}
          icon={CalendarPlus}
          tone="muted"
        />
        <StatCard
          label="Evaluations This Month"
          value={evaluations.filter((e) => e && monthKey(e.created_at) === thisMonth).length}
          icon={CalendarCheck}
          tone="muted"
        />
      </div>

      {players.length === 0 && coaches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Your academy is ready"
          description="Create your first coach account, then register players and assign them for evaluation."
          action={
            <Button asChild>
              <Link to="/admin/coaches/create">+ Create Coach</Link>
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Registrations &amp; evaluations (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--foreground)",
                  }}
                />
                <Line type="monotone" dataKey="players" stroke="var(--chart-1)" strokeWidth={2} />
                <Line
                  type="monotone"
                  dataKey="evaluations"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Players by position
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {byPosition.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byPosition} dataKey="value" nameKey="name" outerRadius="80%">
                    {byPosition.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground pt-10 text-center text-sm">No players yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Players evaluated by coach
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {byCoach.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCoach}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  />
                  <Bar dataKey="players" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground pt-10 text-center text-sm">No coaches yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Average evaluation scores
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgScores}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="area" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                />
                <Bar dataKey="score" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/admin/coaches/create">+ Create Coach</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/players/create">+ Create Player</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/players">
            View all players <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function avg(values: number[]) {
  const filtered = values.filter((v) => v > 0);
  if (!filtered.length) return 0;
  return Math.round((filtered.reduce((a, b) => a + b, 0) / filtered.length) * 10) / 10;
}

export default Route.component;
