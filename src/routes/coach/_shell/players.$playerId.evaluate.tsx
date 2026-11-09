"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EvaluationSkillForm } from "@/components/EvaluationSkillForm";
import { LoadingBlock, ScoreCard } from "@/components/DataCards";
import { fetchPlayer, saveEvaluation, scoresFromSkills, skillStateFromEvaluation } from "@/lib/api";
import { VERDICTS, emptySkillState } from "@/lib/skills";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/coach/_shell/players/$playerId/evaluate")({
  head: () => ({ meta: [{ title: "Evaluate Player | Touchline" }] }),
  component: EvaluatePlayerPage,
});

function EvaluatePlayerPage() {
  const { playerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => fetchPlayer(playerId),
  });

  const [skills, setSkills] = useState(emptySkillState());
  const [assessment, setAssessment] = useState({
    strengths: "",
    weaknesses: "",
    development_goals: "",
    coach_verdict: "",
    coach_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const ownEvaluation =
    data?.evaluation && data.evaluation.coach_id === session?.user.id ? data.evaluation : null;

  useEffect(() => {
    if (!data) return;
    setSkills(skillStateFromEvaluation(ownEvaluation, emptySkillState()));
    if (ownEvaluation) {
      setAssessment({
        strengths: ownEvaluation.strengths ?? "",
        weaknesses: ownEvaluation.weaknesses ?? "",
        development_goals: ownEvaluation.development_goals ?? "",
        coach_verdict: ownEvaluation.coach_verdict ?? "",
        coach_notes: ownEvaluation.coach_notes ?? "",
      });
    }
  }, [data, ownEvaluation]);

  if (isLoading) return <LoadingBlock label="Loading evaluation…" />;
  if (!data) return <p className="text-muted-foreground">This player could not be found.</p>;
  if (data.hasEvaluation && !ownEvaluation) {
    return (
      <div className="mx-auto grid max-w-4xl gap-6">
        <Link
          to="/coach/players/$playerId"
          params={{ playerId }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <Card className="border-border/70">
          <CardContent className="p-8 text-center">
            <h1 className="font-display text-2xl tracking-wide uppercase">Already evaluated</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Another coach has completed this player’s evaluation. No additional evaluation is
              needed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scores = scoresFromSkills(skills);

  const submit = async () => {
    if (data.hasEvaluation && !ownEvaluation) {
      toast.error("This player has already been evaluated by another coach.");
      return;
    }
    if (!session?.user?.id) {
      toast.error("User session not found. Please log in again.");
      return;
    }
    if (!assessment.coach_verdict) {
      toast.error("Please select a coach verdict.");
      return;
    }
    setSaving(true);
    try {
      await saveEvaluation({
        ...(ownEvaluation ? { evaluationId: ownEvaluation.id } : {}),
        playerId,
        coachId: session.user.id,
        skills,
        assessment,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["player", playerId] }),
        queryClient.invalidateQueries({ queryKey: ["players"] }),
        queryClient.invalidateQueries({ queryKey: ["evaluations"] }),
      ]);
      toast.success("Evaluation saved.");
      navigate({ to: "/coach/players/$playerId", params: { playerId } });
    } catch (error) {
      console.error("Save evaluation error:", error);
      toast.error(error instanceof Error ? error.message : "Could not save the evaluation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Link
        to="/coach/players/$playerId"
        params={{ playerId }}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">
          {ownEvaluation ? "Update your evaluation" : "Evaluate player"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {data.player.first_name} {data.player.last_name} · {data.player.position ?? "No position"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ScoreCard label="Technical" score={scores.technical_score} />
        <ScoreCard label="Tactical" score={scores.tactical_score} />
        <ScoreCard label="Physical" score={scores.physical_score} />
        <ScoreCard label="Character" score={scores.personality_score} />
        <ScoreCard label="Overall" score={scores.overall_rating} />
      </div>

      <EvaluationSkillForm skills={skills} onChange={setSkills} />

      <Card className="bg-gradient-panel border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-base tracking-wide uppercase">
            Coach assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Strengths</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={assessment.strengths}
              onChange={(e) => setAssessment((a) => ({ ...a, strengths: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Areas to improve</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={assessment.weaknesses}
              onChange={(e) => setAssessment((a) => ({ ...a, weaknesses: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Development goals</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={assessment.development_goals}
              onChange={(e) => setAssessment((a) => ({ ...a, development_goals: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>
              Coach verdict<span className="text-destructive"> *</span>
            </Label>
            <Select
              value={assessment.coach_verdict}
              onValueChange={(value) => setAssessment((a) => ({ ...a, coach_verdict: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select verdict" />
              </SelectTrigger>
              <SelectContent>
                {VERDICTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Additional notes</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={assessment.coach_notes}
              onChange={(e) => setAssessment((a) => ({ ...a, coach_notes: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={submit} disabled={saving} className="h-12 tracking-widest uppercase">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save evaluation
      </Button>
    </div>
  );
}

export default Route.component;
