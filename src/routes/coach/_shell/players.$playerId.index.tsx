import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/DataCards";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { fetchPlayer } from "@/lib/api";

export const Route = createFileRoute("/coach/_shell/players/$playerId/")({
  head: () => ({ meta: [{ title: "Player Profile | Dios Soccer Academy" }] }),
  component: CoachPlayerProfile,
});

function CoachPlayerProfile() {
  const { playerId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => fetchPlayer(playerId),
  });

  if (isLoading) return <LoadingBlock label="Loading player profile…" />;
  if (!data) return <p className="text-muted-foreground">This player could not be found.</p>;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/coach/players"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my players
        </Link>

        {data.hasEvaluation && !data.evaluation ? (
          <Button variant="outline" disabled>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Already evaluated
          </Button>
        ) : (
          <Button asChild>
            <Link to="/coach/players/$playerId/evaluate" params={{ playerId }}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {data.evaluation ? "Update evaluation" : "Evaluate player"}
            </Link>
          </Button>
        )}
      </div>

      <PlayerProfileView
        player={data.player}
        evaluation={data.evaluation}
        hasEvaluation={data.hasEvaluation}
        coachName={data.coachName}
        coachEmail={data.coachEmail}
      />
    </div>
  );
}
