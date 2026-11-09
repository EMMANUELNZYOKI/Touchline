import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { LoadingBlock } from "@/components/DataCards";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { PlayerEvaluationPDF } from "@/components/PlayerEvaluationPDF";
import { fetchPlayer, photoUrl } from "@/lib/api";

export const Route = createFileRoute("/admin/_shell/players/$playerId")({
  head: () => ({
    meta: [
      {
        title: "Player Profile | Touchline",
      },
    ],
  }),

  component: AdminPlayerProfile,
});

function AdminPlayerProfile() {
  const { playerId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => fetchPlayer(playerId),
  });

  /*
   * Get a signed URL for the player's photo.
   */
  const { data: playerPhotoUrl } = useQuery({
    queryKey: ["player-photo", data?.player.player_photo],
    queryFn: () => photoUrl(data?.player.player_photo ?? null),
    enabled: Boolean(data?.player.player_photo),
  });

  if (isLoading) {
    return <LoadingBlock label="Loading player profile…" />;
  }

  if (!data) {
    return <p className="text-muted-foreground">This player could not be found.</p>;
  }

  const playerName = `${data.player.first_name} ${data.player.last_name}`.trim();

  const fileName = `${playerName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-evaluation-report.pdf`;

  return (
    <div className="grid gap-5">
      {/* ================================================
          ACTION BAR
      ================================================= */}

      <div className="flex items-center justify-between gap-4">
        {/* BACK */}
        <Link
          to="/admin/players"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to players
        </Link>

        {/* DOWNLOAD */}
        <PDFDownloadLink
          document={
            <PlayerEvaluationPDF
              player={data.player}
              evaluation={data.latestEvaluation}
              coachName={data.coachName}
              playerPhotoUrl={playerPhotoUrl ?? null}
              logoUrl="/touchline-mark.svg"
              season={
                data.latestEvaluation
                  ? `${data.latestEvaluation.season} ${data.latestEvaluation.season_year}`
                  : "No evaluation yet"
              }
            />
          }
          fileName={fileName}
        >
          {({ loading }) => (
            <button
              type="button"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />

              {loading ? "Preparing report..." : "Download Report"}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* ================================================
          PLAYER PROFILE
      ================================================= */}

      <PlayerProfileView
        player={data.player}
        evaluation={data.latestEvaluation}
        coachName={data.coachName}
        coachEmail={data.coachEmail}
      />
    </div>
  );
}
