"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import { LoadingBlock } from "@/components/DataCards";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { PlayerEvaluationPDF } from "@/components/PlayerEvaluationPDF";
import { academyLogoDataUrl, fetchPlayer, photoUrl } from "@/lib/api";

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

  const { data: academyLogoUrlResult } = useQuery({
    queryKey: ["academy-logo", data?.academyLogoPath],
    queryFn: () => academyLogoDataUrl(data?.academyLogoPath ?? null),
    enabled: Boolean(data?.academyLogoPath),
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
    <div className="tl-print-page grid gap-5">
      {/* ================================================
          ACTION BAR
      ================================================= */}

      <div className="tl-print-hide flex items-center justify-between gap-4">
        {/* BACK */}
        <Link
          to="/admin/players"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to players
        </Link>

        {/* DOWNLOAD */}
        <div className="flex items-center gap-2">
          <PDFDownloadLink
            document={
              <PlayerEvaluationPDF
                player={data.player}
                evaluation={data.latestEvaluation}
                coachName={data.coachName}
                academyName={data.academyName}
                academySlug={data.academySlug}
                academyEmail={data.academyEmail}
                academyPhone={data.academyPhone}
                playerPhotoUrl={playerPhotoUrl ?? null}
                logoUrl={academyLogoUrlResult ?? null}
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
                {loading ? "Preparing report..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
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

export default Route.component;
