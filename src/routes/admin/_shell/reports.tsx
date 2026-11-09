import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart3, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, LoadingBlock, ScoreCard } from "@/components/DataCards";
import { RatingBadge } from "@/components/PlayersTable";
import { fetchEvaluations } from "@/lib/api";
import { SKILL_CATEGORIES } from "@/lib/skills";
import type { Evaluation } from "@/lib/types";

export const Route = createFileRoute("/admin/_shell/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics | Touchline" }] }),
  component: AdminReportsPage,
});

const SEASON_ORDER: Record<string, number> = {
  "JAN-APR": 0,
  "MAY-AUG": 1,
  "SEP-DEC": 2,
  UNSPECIFIED: -1,
};

type EvaluationRow = Evaluation & {
  playerName: string;
  position: string;
  coachName: string;
};

function getPeriodKey(evaluation: Pick<Evaluation, "season" | "season_year">) {
  return `${evaluation.season_year}-${evaluation.season}`;
}

function csvValue(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedComparison, setSelectedComparison] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["evaluations", "all"],
    queryFn: fetchEvaluations,
  });

  if (isLoading) return <LoadingBlock label="Building reports…" />;
  const evaluations = (data ?? []) as EvaluationRow[];
  const periodMap = new Map<string, { key: string; season: string; year: number }>();
  for (const evaluation of evaluations) {
    const key = getPeriodKey(evaluation);
    periodMap.set(key, {
      key,
      season: evaluation.season,
      year: evaluation.season_year,
    });
  }
  const periods = [...periodMap.values()].sort(
    (a, b) => b.year - a.year || (SEASON_ORDER[b.season] ?? -1) - (SEASON_ORDER[a.season] ?? -1),
  );
  const primaryKey = periods.some((period) => period.key === selectedPeriod)
    ? selectedPeriod
    : (periods[0]?.key ?? "");
  const comparisonPeriod =
    periods.find((period) => period.key === selectedComparison && period.key !== primaryKey) ??
    periods.find((period) => period.key !== primaryKey);
  const comparisonKey = comparisonPeriod?.key ?? "";
  const primaryPeriod = periods.find((period) => period.key === primaryKey);
  const selectedEvaluations = evaluations.filter(
    (evaluation) => getPeriodKey(evaluation) === primaryKey,
  );
  const comparisonEvaluations = evaluations.filter(
    (evaluation) => getPeriodKey(evaluation) === comparisonKey,
  );

  if (evaluations.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No data to report yet"
        description="Reports unlock once coaches submit player evaluations. Each evaluation will be saved with its season and year."
      />
    );
  }

  const average = (values: (number | null | undefined)[]) => {
    const numbers = values.filter((value): value is number => typeof value === "number");
    if (!numbers.length) return 0;
    return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10;
  };
  const radarData = SKILL_CATEGORIES.map((category) => ({
    area: category.label,
    score: average(
      selectedEvaluations.map(
        (evaluation) => evaluation[category.scoreColumn as keyof Evaluation] as number | null,
      ),
    ),
  }));
  const byPosition = Object.entries(
    selectedEvaluations.reduce<Record<string, number[]>>((acc, evaluation) => {
      const key = evaluation.position || "Unassigned";
      acc[key] = [...(acc[key] ?? []), evaluation.overall_rating ?? 0];
      return acc;
    }, {}),
  ).map(([name, values]) => ({ name, rating: average(values) }));
  const topPlayers = [...selectedEvaluations]
    .sort((a, b) => (b.overall_rating ?? 0) - (a.overall_rating ?? 0))
    .slice(0, 10);

  const priorByPlayer = new Map(
    comparisonEvaluations.map((evaluation) => [evaluation.player_id, evaluation]),
  );
  const improvements = selectedEvaluations
    .map((current) => ({ current, prior: priorByPlayer.get(current.player_id) }))
    .filter(
      (entry): entry is { current: EvaluationRow; prior: EvaluationRow } =>
        entry.prior !== undefined,
    )
    .sort(
      (a, b) =>
        (b.current.overall_rating ?? -1) -
        (b.prior.overall_rating ?? -1) -
        ((a.current.overall_rating ?? -1) - (a.prior.overall_rating ?? -1)),
    );

  const exportCsv = () => {
    if (!selectedEvaluations.length || !primaryPeriod) return;
    const header = [
      "Season",
      "Year",
      "Player ID",
      "Player",
      "Position",
      "Evaluating coach",
      "Technical",
      "Tactical",
      "Physical",
      "Character",
      "Overall",
      "Verdict",
      "Strengths",
      "Areas to improve",
      "Development goals",
      "Coach notes",
      "Evaluated on",
    ];
    const rows = selectedEvaluations.map((evaluation) => [
      evaluation.season,
      evaluation.season_year,
      evaluation.player_id,
      evaluation.playerName,
      evaluation.position,
      evaluation.coachName,
      evaluation.technical_score,
      evaluation.tactical_score,
      evaluation.physical_score,
      evaluation.personality_score,
      evaluation.overall_rating,
      evaluation.coach_verdict,
      evaluation.strengths,
      evaluation.weaknesses,
      evaluation.development_goals,
      evaluation.coach_notes,
      new Date(evaluation.created_at).toISOString().slice(0, 10),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `touchline-${primaryPeriod.season.toLowerCase()}-${primaryPeriod.year}-report.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const periodLabel = (period: { season: string; year: number } | undefined) =>
    period ? `${period.season} ${period.year}` : "Select a season";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide uppercase">Reports &amp; analytics</h1>
          <p className="text-muted-foreground text-sm">
            {selectedEvaluations.length} player evaluations · {periodLabel(primaryPeriod)}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!selectedEvaluations.length}>
          <Download className="mr-2 h-4 w-4" /> Download season CSV
        </Button>
      </div>

      <Card className="border-border/70">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Report season</label>
            <Select value={primaryKey} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a season and year" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.key} value={period.key}>
                    {periodLabel(period)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Compare against</label>
            <Select
              value={comparisonKey || "none"}
              onValueChange={(value) => setSelectedComparison(value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a comparison season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No comparison</SelectItem>
                {periods
                  .filter((period) => period.key !== primaryKey)
                  .map((period) => (
                    <SelectItem key={period.key} value={period.key}>
                      {periodLabel(period)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedEvaluations.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No evaluations for this season"
          description="Choose another season, or wait for a coach to submit an evaluation for this season."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {radarData.map((item) => (
              <ScoreCard
                key={item.area}
                label={`${primaryPeriod?.season} ${item.area}`}
                score={item.score}
              />
            ))}
          </div>

          {comparisonPeriod && (
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-base tracking-wide uppercase">
                  <TrendingUp className="h-4 w-4" />
                  Player improvement: {periodLabel(comparisonPeriod)} → {periodLabel(primaryPeriod)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {improvements.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-border border-b text-left">
                          <th className="p-2">Player</th>
                          <th className="p-2">Coach ({primaryPeriod?.season})</th>
                          <th className="p-2 text-right">Previous</th>
                          <th className="p-2 text-right">Current</th>
                          <th className="p-2 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {improvements.map(({ current, prior }) => {
                          const delta =
                            current.overall_rating != null && prior.overall_rating != null
                              ? Math.round((current.overall_rating - prior.overall_rating) * 10) /
                                10
                              : null;
                          return (
                            <tr key={current.player_id} className="border-border/50 border-b">
                              <td className="p-2 font-medium">{current.playerName}</td>
                              <td className="p-2 text-muted-foreground">{current.coachName}</td>
                              <td className="p-2 text-right">
                                {prior.overall_rating?.toFixed(1) ?? "—"}
                              </td>
                              <td className="p-2 text-right">
                                {current.overall_rating?.toFixed(1) ?? "—"}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No players have evaluations in both selected seasons yet.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="font-display text-base tracking-wide uppercase">
                  {periodLabel(primaryPeriod)} skill profile
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="area"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 10]}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    />
                    <Radar
                      dataKey="score"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="font-display text-base tracking-wide uppercase">
                  Average rating by position
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byPosition} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 10]}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                      }}
                    />
                    <Bar dataKey="rating" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="font-display text-base tracking-wide uppercase">
                Top 10 rated players · {periodLabel(primaryPeriod)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {topPlayers.map((evaluation, index) => (
                <div
                  key={evaluation.id}
                  className="border-border/60 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-muted-foreground w-6 text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{evaluation.playerName}</p>
                      <p className="text-muted-foreground text-xs">
                        {evaluation.position} · Evaluated by {evaluation.coachName}
                      </p>
                    </div>
                  </div>
                  <RatingBadge rating={evaluation.overall_rating} />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
