"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/DataCards";
import { PlayersTable } from "@/components/PlayersTable";
import { fetchPlayers } from "@/lib/api";

export const Route = createFileRoute("/admin/_shell/players/")({
  head: () => ({ meta: [{ title: "All Players | Touchline" }] }),
  component: AdminPlayersPage,
});

function AdminPlayersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["players", "all"],
    queryFn: () => fetchPlayers(),
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">Players</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Academy-wide roster ({data?.length ?? 0} players)
          </p>
          <Button asChild>
            <Link to="/admin/players/create">+ Create Player</Link>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <LoadingBlock label="Loading players…" />
      ) : (
        <PlayersTable players={data ?? []} area="admin" showCoach />
      )}
    </div>
  );
}

export default Route.component;
