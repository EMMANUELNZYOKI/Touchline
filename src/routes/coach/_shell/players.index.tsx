import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoadingBlock } from "@/components/DataCards";
import { PlayersTable } from "@/components/PlayersTable";
import { fetchPlayers } from "@/lib/api";

export const Route = createFileRoute("/coach/_shell/players/")({
  head: () => ({ meta: [{ title: "Players to Evaluate | Dios Soccer Academy" }] }),
  component: CoachPlayersPage,
});

function CoachPlayersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["players", "all"],
    queryFn: () => fetchPlayers(),
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide uppercase">Players to evaluate</h1>
          <p className="text-muted-foreground text-sm">{data?.length ?? 0} registered players</p>
        </div>
      </div>

      {isLoading || !data ? (
        <LoadingBlock label="Loading registered players…" />
      ) : (
        <PlayersTable players={data} area="coach" />
      )}
    </div>
  );
}
