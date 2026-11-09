"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, ClipboardCheck, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingBlock, StatCard } from "@/components/DataCards";
import { RatingBadge } from "@/components/PlayersTable";
import { fetchEvaluations } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/coach/_shell/history")({
  head: () => ({ meta: [{ title: "My Evaluation History | Touchline" }] }),
  component: CoachEvaluationHistoryPage,
});

function CoachEvaluationHistoryPage() {
  const { session } = useAuth();
  const coachId = session?.user.id;
  const { data, isLoading } = useQuery({
    queryKey: ["evaluations", "coach-history", coachId],
    queryFn: fetchEvaluations,
    enabled: !!coachId,
  });

  if (isLoading || !data) return <LoadingBlock label="Loading your evaluation history…" />;

  // Evaluation RLS already limits coaches to their own rows; keep the explicit
  // filter as defense in depth and to make the page's scope clear.
  const evaluations = data
    .filter((evaluation) => evaluation.coach_id === coachId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const rated = evaluations.filter((evaluation) => evaluation.overall_rating != null);
  const averageRating = rated.length
    ? Math.round(
        (rated.reduce((sum, evaluation) => sum + (evaluation.overall_rating ?? 0), 0) /
          rated.length) *
          10,
      ) / 10
    : 0;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const distinctPlayers = new Set(evaluations.map((evaluation) => evaluation.player_id)).size;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">My Evaluation History</h1>
        <p className="text-muted-foreground text-sm">
          Your submitted evaluations and performance summary. Other coaches’ evaluations are not
          included.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Evaluations Submitted" value={evaluations.length} icon={ClipboardCheck} />
        <StatCard label="Players Evaluated" value={distinctPlayers} icon={Users} tone="accent" />
        <StatCard
          label="Average Overall Rating"
          value={averageRating ? `${averageRating}/10` : "—"}
          icon={Star}
          tone="accent"
        />
        <StatCard
          label="Evaluations This Month"
          value={
            evaluations.filter((evaluation) => evaluation.created_at.slice(0, 7) === thisMonth)
              .length
          }
          icon={CalendarCheck}
          tone="muted"
        />
      </div>

      {evaluations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No evaluations yet"
          description="Evaluations you submit for registered players will appear here with your personal statistics."
        />
      ) : (
        <Card className="border-border/70 overflow-hidden">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Your submitted evaluations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-center">Technical</TableHead>
                    <TableHead className="text-center">Tactical</TableHead>
                    <TableHead className="text-center">Physical</TableHead>
                    <TableHead className="text-center">Character</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.playerName}</TableCell>
                      <TableCell className="text-muted-foreground">{evaluation.position}</TableCell>
                      <TableCell className="text-muted-foreground">{evaluation.season}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {evaluation.season_year}
                      </TableCell>
                      <TableCell className="text-center">
                        {evaluation.technical_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {evaluation.tactical_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {evaluation.physical_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {evaluation.personality_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RatingBadge rating={evaluation.overall_rating} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {evaluation.coach_verdict ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Route.component;
