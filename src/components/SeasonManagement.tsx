"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  archiveAcademySeason,
  createAcademySeason,
  fetchAcademySeasons,
  setCurrentAcademySeason,
  type AcademySeason,
} from "@/lib/api";

function effectiveStatus(season: AcademySeason) {
  if (season.status === "archived") return "Archived";
  if (new Date(`${season.ends_on}T23:59:59`) < new Date()) return "Completed";
  if (season.is_current) return "Active";
  return "Scheduled";
}

export function SeasonManagement({ academyId }: { academyId: string | null }) {
  const queryClient = useQueryClient();
  const seasonsQuery = useQuery({
    queryKey: ["academy-seasons", academyId],
    queryFn: () => fetchAcademySeasons(academyId ?? undefined),
    enabled: Boolean(academyId),
  });
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["academy-seasons", academyId] });
    await queryClient.invalidateQueries({ queryKey: ["players"] });
    await queryClient.invalidateQueries({ queryKey: ["evaluations"] });
  };

  const createSeason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!academyId) return;
    setSaving(true);
    try {
      await createAcademySeason({ academyId, name, startsOn, endsOn });
      setName("");
      setStartsOn("");
      setEndsOn("");
      await refresh();
      toast.success("Season created. Activate it when the new season begins.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the season.");
    } finally {
      setSaving(false);
    }
  };

  const activate = async (season: AcademySeason) => {
    setWorkingId(season.id);
    try {
      await setCurrentAcademySeason(season.id);
      await refresh();
      toast.success(`${season.name} is now the current season.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not activate the season.");
    } finally {
      setWorkingId(null);
    }
  };

  const archive = async (season: AcademySeason) => {
    setWorkingId(season.id);
    try {
      await archiveAcademySeason(season.id);
      await refresh();
      toast.success("Season archived. Its evaluations remain available in history.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not archive the season.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2 text-base tracking-wide uppercase">
          <CalendarDays className="h-4 w-4" /> Seasons
        </CardTitle>
        <CardDescription>
          Create explicit academy seasons so evaluations reset for the new period while
          previous-season reports remain available.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form className="grid gap-4 rounded-xl border border-border/60 p-4" onSubmit={createSeason}>
          <p className="font-semibold">Create a season</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-3">
              <Label htmlFor="season-name">Season name</Label>
              <Input
                id="season-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Season 2"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="season-start">Start date</Label>
              <Input
                id="season-start"
                type="date"
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="season-end">End date</Label>
              <Input
                id="season-end"
                type="date"
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving || !academyId} className="w-full sm:w-auto">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Creating…" : "Create season"}
              </Button>
            </div>
          </div>
        </form>
        {seasonsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading seasons…</p>
        ) : (seasonsQuery.data ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">No seasons have been configured yet.</p>
        ) : (
          <div className="grid gap-3">
            {(seasonsQuery.data ?? []).map((season) => {
              const status = effectiveStatus(season);
              const busy = workingId === season.id;
              return (
                <div
                  key={season.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{season.name}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${status === "Active" ? "bg-primary/15 text-primary" : status === "Completed" ? "bg-muted text-muted-foreground" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {new Date(`${season.starts_on}T00:00:00`).toLocaleDateString()} –{" "}
                      {new Date(`${season.ends_on}T00:00:00`).toLocaleDateString()}
                    </p>
                    {status === "Completed" && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Previous evaluations are retained for reports and history.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!season.is_current && season.status !== "archived" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void activate(season)}
                      >
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Set as current
                      </Button>
                    )}
                    {!season.is_current && season.status !== "archived" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void archive(season)}
                        title="Archive season"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
