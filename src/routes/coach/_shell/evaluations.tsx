"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingBlock } from "@/components/DataCards";
import { RatingBadge } from "@/components/PlayersTable";
import { fetchPlayers } from "@/lib/api";

export const Route = createFileRoute("/coach/_shell/evaluations")({
  head: () => ({ meta: [{ title: "My Evaluations | Touchline" }] }),
  component: CoachEvaluationsPage,
});

function CoachEvaluationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["players", "all"],
    queryFn: () => fetchPlayers(),
  });

  if (isLoading || !data) return <LoadingBlock label="Loading evaluations…" />;

  const evaluated = data.filter((p) => p.hasEvaluation);
  const pending = data.filter((p) => !p.hasEvaluation);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">Player evaluations</h1>
        <p className="text-muted-foreground text-sm">
          {evaluated.length} already evaluated · {pending.length} awaiting evaluation
        </p>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing to evaluate yet"
          description="Players registered by the Super Admin will appear here for evaluation."
        />
      ) : (
        <Card className="border-border/70 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Category / Team</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Technical</TableHead>
                    <TableHead className="text-center">Tactical</TableHead>
                    <TableHead className="text-center">Physical</TableHead>
                    <TableHead className="text-center">Character</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.first_name} {p.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.team_category ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.season ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.position ?? "—"}</TableCell>
                      <TableCell>
                        {p.hasEvaluation ? "Already evaluated" : "Awaiting evaluation"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.evaluation?.technical_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.evaluation?.tactical_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.evaluation?.physical_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.evaluation?.personality_score?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RatingBadge rating={p.evaluation?.overall_rating} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.evaluation?.coach_verdict ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.hasEvaluation && !p.evaluation ? (
                          <Button size="sm" variant="outline" disabled>
                            Already evaluated
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              to="/coach/players/$playerId/evaluate"
                              params={{ playerId: p.id }}
                            >
                              {p.evaluation ? "Update" : "Evaluate"}
                            </Link>
                          </Button>
                        )}
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
