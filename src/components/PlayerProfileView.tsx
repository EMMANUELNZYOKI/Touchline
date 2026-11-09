import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "@/components/DataCards";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { SKILL_CATEGORIES, calculateAge } from "@/lib/skills";
import type { Evaluation, Player } from "@/lib/types";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Props {
  player: Player;
  evaluation: Evaluation | null;
  hasEvaluation?: boolean;
  coachName: string;
  coachEmail?: string;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

export function PlayerProfileView({
  player,
  evaluation,
  hasEvaluation = Boolean(evaluation),
  coachName,
  coachEmail,
}: Props) {
  const fullName = `${player.first_name} ${player.last_name}`;
  const age = calculateAge(player.date_of_birth);
  const radarData = [
    { area: "Technical", score: evaluation?.technical_score ?? 0 },
    { area: "Tactical", score: evaluation?.tactical_score ?? 0 },
    { area: "Physical", score: evaluation?.physical_score ?? 0 },
    { area: "Character", score: evaluation?.personality_score ?? 0 },
  ];

  return (
    <div className="grid gap-6">
      <Card className="bg-gradient-panel border-border/70 shadow-elevated">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <PlayerAvatar path={player.player_photo} name={fullName} className="h-24 w-24 text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl tracking-wide uppercase sm:text-3xl">
                {fullName}
              </h1>
              {player.jersey_number != null && (
                <Badge className="bg-primary/15 text-primary border-primary/30">
                  #{player.jersey_number}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {player.team_category ?? "Category not set"}
              {player.season ? ` · ${player.season}` : ""} · {player.position ?? "Position not set"}
              {player.secondary_position ? ` (${player.secondary_position})` : ""} ·{" "}
              {age != null ? `${age} yrs` : "Age unknown"} · {player.preferred_foot ?? "—"} foot
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {coachName === "Not assigned" ? "Awaiting coach assignment" : "Evaluated by"}{" "}
              <span className="text-primary font-semibold">{coachName}</span>
              {coachEmail ? ` (${coachEmail})` : ""}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs tracking-widest uppercase">Overall</p>
            <p className="font-display text-gradient-gold text-5xl">
              {evaluation?.overall_rating != null ? evaluation.overall_rating.toFixed(1) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Player Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Field label="Category / Team" value={player.team_category} />
            <Field label="Season" value={player.season} />
            <Field label="Date of birth" value={player.date_of_birth} />
            <Field label="Gender" value={player.gender} />
            <Field label="Phone" value={player.phone} />
            <Field label="Height (cm)" value={player.height} />
            <Field label="Weight (kg)" value={player.weight} />
            <Field label="Preferred foot" value={player.preferred_foot} />
            <Field label="Guardian" value={player.parent_name} />
            <Field label="Guardian phone" value={player.parent_phone} />
            <Field label="Emergency contact" value={player.emergency_contact} />
            <div className="col-span-2 sm:col-span-3">
              <Field label="Medical notes" value={player.medical_notes} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display text-base tracking-wide uppercase">
              Evaluation Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  dataKey="score"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Technical" score={evaluation?.technical_score} />
        <ScoreCard label="Tactical" score={evaluation?.tactical_score} />
        <ScoreCard label="Physical" score={evaluation?.physical_score} />
        <ScoreCard label="Personality" score={evaluation?.personality_score} />
      </div>

      {evaluation ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {SKILL_CATEGORIES.map((category) => {
              const skills = (evaluation[category.column as keyof Evaluation] ?? {}) as Record<
                string,
                number
              >;
              return (
                <Card key={category.key} className="border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base tracking-wide uppercase">
                      {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {category.skills.map((skill) => {
                      const value = skills[skill] ?? 0;
                      return (
                        <div key={skill} className="flex items-center gap-3">
                          <span className="w-40 shrink-0 text-sm">{skill}</span>
                          <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                            <span
                              className="bg-gradient-gold block h-full rounded-full"
                              style={{ width: `${(value / 10) * 100}%` }}
                            />
                          </span>
                          <span className="font-display w-8 text-right text-sm">
                            {value || "—"}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="font-display text-base tracking-wide uppercase">
                Coach Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field label="Strengths" value={evaluation.strengths} />
              <Field label="Weaknesses" value={evaluation.weaknesses} />
              <Field label="Development goals" value={evaluation.development_goals} />
              <Field label="Coach verdict" value={evaluation.coach_verdict} />
              <div className="sm:col-span-2">
                <Field label="Additional notes" value={evaluation.coach_notes} />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Evaluated on"
                  value={new Date(evaluation.created_at).toLocaleDateString()}
                />
              </div>
            </CardContent>
          </Card>
        </>
      ) : hasEvaluation ? (
        <Card className="border-border/70">
          <CardContent className="text-muted-foreground p-8 text-center text-sm">
            This player has already been evaluated. Evaluation details are available to the
            evaluating coach and Super Admin.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 border-dashed">
          <CardContent className="text-muted-foreground p-8 text-center text-sm">
            No evaluation has been completed for this player yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
