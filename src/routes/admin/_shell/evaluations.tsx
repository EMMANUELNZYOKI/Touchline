import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { fetchEvaluations } from "@/lib/api";

export const Route = createFileRoute("/admin/_shell/evaluations")({
  head: () => ({ meta: [{ title: "Evaluations | Dios Soccer Academy" }] }),
  component: AdminEvaluationsPage,
});

function AdminEvaluationsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["evaluations"], queryFn: fetchEvaluations });

  if (isLoading) return <LoadingBlock label="Loading evaluations…" />;
  const evaluations = data ?? [];
  const rows = evaluations.filter((e) =>
    `${e.playerName} ${e.coachName} ${e.position} ${e.season} ${e.season_year}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">Evaluations</h1>
        <p className="text-muted-foreground text-sm">
          {evaluations.length} evaluation{evaluations.length === 1 ? "" : "s"} submitted by coaches
        </p>
      </div>

      {evaluations.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No evaluations yet"
          description="Once coaches assess their players, every evaluation appears here."
        />
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search by player or coach…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Card className="border-border/70 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-center">Technical</TableHead>
                      <TableHead className="text-center">Tactical</TableHead>
                      <TableHead className="text-center">Physical</TableHead>
                      <TableHead className="text-center">Character</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.playerName}</TableCell>
                        <TableCell className="text-muted-foreground">{e.position}</TableCell>
                        <TableCell className="text-muted-foreground">{e.coachName}</TableCell>
                        <TableCell className="text-muted-foreground">{e.season}</TableCell>
                        <TableCell className="text-muted-foreground">{e.season_year}</TableCell>
                        <TableCell className="text-center">
                          {e.technical_score?.toFixed(1) ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {e.tactical_score?.toFixed(1) ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {e.physical_score?.toFixed(1) ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {e.personality_score?.toFixed(1) ?? "—"}
                        </TableCell>
                        <TableCell>
                          <RatingBadge rating={e.overall_rating} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/admin/players/$playerId" params={{ playerId: e.player_id }}>
                              View player
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-muted-foreground py-10 text-center">
                          No evaluations match “{search}”.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
