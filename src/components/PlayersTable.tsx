"use client";

import { Link } from "@/lib/next-router-compat";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePlayer, logAdminActivity } from "@/lib/api";
import { Search, UserSquare2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { EmptyState } from "@/components/DataCards";
import { POSITIONS, calculateAge, ratingTone } from "@/lib/skills";
import type { PlayerRow } from "@/lib/api";

interface Props {
  players: PlayerRow[];
  area: "admin" | "coach";
  showCoach?: boolean;
  emptyAction?: React.ReactNode;
}

export function RatingBadge({ rating }: { rating: number | null | undefined }) {
  if (rating == null) return <Badge variant="outline">Not evaluated</Badge>;
  const tone = ratingTone(rating);
  return (
    <Badge
      className={
        tone === "success"
          ? "bg-accent/15 text-accent border-accent/30"
          : tone === "primary"
            ? "bg-primary/15 text-primary border-primary/30"
            : "bg-destructive/15 text-destructive border-destructive/30"
      }
    >
      {rating.toFixed(1)}/10
    </Badge>
  );
}

export function PlayersTable({ players, area, showCoach, emptyAction }: Props) {
  const queryClient = useQueryClient();
  const removePlayer = async (playerId: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This also removes their evaluations.`)) return;
    try {
      await deletePlayer(playerId);
      try {
        await logAdminActivity({
          action: "player_deleted",
          entityType: "player",
          entityId: playerId,
          summary: `${name} deleted`,
        });
      } catch (logError) {
        console.error("Could not record player deletion activity", logError);
      }
      await queryClient.invalidateQueries({ queryKey: ["players"] });
      await queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success("Player deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete player.");
    }
  };
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("all");
  const [sort, setSort] = useState("recent");

  const rows = useMemo(() => {
    const filtered = players.filter((p) => {
      const haystack =
        `${p.first_name} ${p.last_name} ${p.position ?? ""} ${p.coachName}`.toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchPosition = position === "all" || p.position === position;
      return matchSearch && matchPosition;
    });
    return filtered.sort((a, b) => {
      if (sort === "name") return `${a.first_name}`.localeCompare(`${b.first_name}`);
      if (sort === "rating")
        return (b.evaluation?.overall_rating ?? -1) - (a.evaluation?.overall_rating ?? -1);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [players, search, position, sort]);

  if (players.length === 0) {
    return (
      <EmptyState
        icon={UserSquare2}
        title="No players yet"
        description={
          area === "coach"
            ? "Players registered by your Academy Owner or Manager will appear here for evaluation."
            : "Register players here and make them available to coaches for evaluation."
        }
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All positions</SelectItem>
            {POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="rating">Highest rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">Age</TableHead>
                  {showCoach && <TableHead>Coach</TableHead>}
                  <TableHead>{area === "coach" ? "Evaluation status" : "Overall"}</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          path={player.player_photo}
                          name={`${player.first_name} ${player.last_name}`}
                          className="h-9 w-9 text-xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {player.first_name} {player.last_name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {player.jersey_number != null
                              ? `#${player.jersey_number}`
                              : "No jersey"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {player.position ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {calculateAge(player.date_of_birth) ?? "—"}
                    </TableCell>
                    {showCoach && (
                      <TableCell className="text-muted-foreground">{player.coachName}</TableCell>
                    )}
                    <TableCell>
                      {area === "coach" && player.hasEvaluation && !player.evaluation ? (
                        <Badge variant="outline">Already evaluated</Badge>
                      ) : (
                        <RatingBadge rating={player.evaluation?.overall_rating} />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(player.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {area === "coach" && player.hasEvaluation && !player.evaluation ? (
                        <Button size="sm" variant="outline" disabled>
                          Already evaluated
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          {area === "admin" ? (
                            <Link to="/admin/players/$playerId" params={{ playerId: player.id }}>
                              View profile
                            </Link>
                          ) : (
                            <Link to="/coach/players/$playerId" params={{ playerId: player.id }}>
                              {player.evaluation ? "View evaluation" : "Evaluate player"}
                            </Link>
                          )}
                        </Button>
                      )}
                      {area === "admin" && (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              to="/admin/players/edit/$playerId"
                              params={{ playerId: player.id }}
                            >
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Delete ${player.first_name} ${player.last_name}`}
                            onClick={() =>
                              removePlayer(player.id, `${player.first_name} ${player.last_name}`)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={showCoach ? 7 : 6}
                      className="text-muted-foreground py-10 text-center"
                    >
                      No players match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
