"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logAdminActivity, registerPlayer, uploadPlayerPhoto, type PlayerInput } from "@/lib/api";
import { GENDERS, POSITIONS, PREFERRED_FOOT } from "@/lib/skills";
import { useAuth } from "@/lib/auth";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { isPackageLimitError } from "@/lib/package-limits";

export const Route = createFileRoute("/admin/_shell/players/create")({
  component: CreatePlayerPage,
  head: () => ({ meta: [{ title: "Create Player | Touchline" }] }),
});
const blank: PlayerInput = {
  first_name: "",
  last_name: "",
  date_of_birth: null,
  gender: null,
  season: null,
  team_category: null,
  phone: null,
  parent_name: null,
  parent_phone: null,
  emergency_contact: null,
  position: null,
  secondary_position: null,
  preferred_foot: null,
  jersey_number: null,
  player_photo: null,
  height: null,
  weight: null,
  medical_notes: null,
};

function CreatePlayerPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { profile, session, role } = useAuth();
  const [player, setPlayer] = useState<PlayerInput>(blank);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const set = <K extends keyof PlayerInput>(key: K, value: PlayerInput[K]) =>
    setPlayer((p) => ({ ...p, [key]: value }));
  const field = (label: string, key: keyof PlayerInput, type = "text") => (
    <div className="grid gap-2" key={key}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={(player[key] as string | number | null) ?? ""}
        onChange={(e) =>
          set(
            key,
            (type === "number"
              ? e.target.value
                ? Number(e.target.value)
                : null
              : e.target.value || null) as PlayerInput[typeof key],
          )
        }
      />
    </div>
  );
  const submit = async () => {
    if (!player.first_name?.trim() || !player.last_name?.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    setSaving(true);
    try {
      let photoPath = player.player_photo;
      if (photo) {
        const userId = session?.user.id;
        if (!userId) {
          throw new Error("Your session expired. Sign in again before uploading a player photo.");
        }
        photoPath = await uploadPlayerPhoto(userId, photo);
      }
      const createdPlayer = await registerPlayer({
        player: { ...player, player_photo: photoPath },
      });
      try {
        await logAdminActivity({
          action: "player_created",
          entityType: "player",
          entityId: createdPlayer.id,
          summary: `${createdPlayer.first_name} ${createdPlayer.last_name} registered`,
          metadata: { photoUploaded: Boolean(photoPath) },
        });
      } catch (logError) {
        console.error("Could not record player creation activity", logError);
      }
      await qc.invalidateQueries({ queryKey: ["players"] });
      toast.success(`${createdPlayer.first_name} ${createdPlayer.last_name} registered.`);
      nav({ to: "/admin/players" });
    } catch (e) {
      if (isPackageLimitError(e, "players")) {
        if (role === "academy_admin") {
          toast.error(
            "Your package player limit has been reached. Choose a larger package to continue.",
          );
          setUpgradeOpen(true);
        } else {
          toast.error("The academy player limit has been reached. Contact the Academy Owner.");
        }
      } else {
        toast.error(e instanceof Error ? e.message : "Could not create player.");
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      {role === "academy_admin" && (
        <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} profile={profile} />
      )}
      <Link
        to="/admin/players"
        className="text-muted-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to players
      </Link>
      <div>
        <h1 className="font-display text-2xl uppercase">Create player</h1>
        <p className="text-muted-foreground text-sm">
          Enter the player’s personal and football information through medical notes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("First name *", "first_name")}
          {field("Last name *", "last_name")}
          {field("Date of birth", "date_of_birth", "date")}
          <div className="grid gap-2">
            <Label>Gender</Label>
            <Select value={player.gender ?? ""} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field("Player phone", "phone")}
          {field("Parent / guardian name", "parent_name")}
          {field("Parent / guardian phone", "parent_phone")}
          {field("Emergency contact", "emergency_contact")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Football and medical information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Primary position</Label>
            <Select value={player.position ?? ""} onValueChange={(v) => set("position", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Secondary position</Label>
            <Select
              value={player.secondary_position ?? ""}
              onValueChange={(v) => set("secondary_position", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Preferred foot</Label>
            <Select
              value={player.preferred_foot ?? ""}
              onValueChange={(v) => set("preferred_foot", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select foot" />
              </SelectTrigger>
              <SelectContent>
                {PREFERRED_FOOT.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              maxLength={80}
              placeholder="e.g. January to May"
              value={player.season ?? ""}
              onChange={(event) => set("season", event.target.value || null)}
            />
            <p className="text-muted-foreground text-xs">
              Enter the season format used by your academy.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="team-category">Category / team</Label>
            <Input
              id="team-category"
              maxLength={80}
              placeholder="e.g. Under 7, Under 11, Seniors"
              value={player.team_category ?? ""}
              onChange={(event) => set("team_category", event.target.value || null)}
            />
            <p className="text-muted-foreground text-xs">
              Enter the team or category naming used by your academy.
            </p>
          </div>
          {field("Jersey number", "jersey_number", "number")}
          {field("Height (cm)", "height", "number")}
          {field("Weight (kg)", "weight", "number")}
          <div className="grid gap-2 sm:col-span-2">
            <Label>Player photo</Label>
            <label className="border-border/70 hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm transition-colors">
              <Upload className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">
                {photo ? photo.name : "Upload a photo (JPG, PNG, or WebP; max 5MB)"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error("Photo must be smaller than 5MB.");
                    return;
                  }
                  setPhoto(file);
                }}
              />
            </label>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Medical notes</Label>
            <Textarea
              rows={4}
              maxLength={1000}
              value={player.medical_notes ?? ""}
              onChange={(e) => set("medical_notes", e.target.value || null)}
              placeholder="Allergies, injuries, or relevant conditions"
            />
          </div>
        </CardContent>
      </Card>
      <Button onClick={submit} disabled={saving} className="h-12">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create player
      </Button>
    </div>
  );
}

export default Route.component;
