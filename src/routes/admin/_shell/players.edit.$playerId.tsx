"use client";

import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  fetchPlayer,
  logAdminActivity,
  photoUrl,
  updatePlayer,
  uploadPlayerPhoto,
  type PlayerInput,
} from "@/lib/api";
import { GENDERS, POSITIONS, PREFERRED_FOOT } from "@/lib/skills";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/_shell/players/edit/$playerId")({
  component: EditPlayerPage,
  head: () => ({ meta: [{ title: "Edit Player | Touchline" }] }),
});

const TEAM_CATEGORIES = ["U-7", "U-9", "U-11", "U-13", "U-15"] as const;

function playerInputFromPlayer(
  player: NonNullable<Awaited<ReturnType<typeof fetchPlayer>>>["player"],
): PlayerInput {
  return {
    first_name: player.first_name,
    last_name: player.last_name,
    date_of_birth: player.date_of_birth,
    gender: player.gender,
    season: player.season,
    team_category: player.team_category,
    phone: player.phone,
    parent_name: player.parent_name,
    parent_phone: player.parent_phone,
    emergency_contact: player.emergency_contact,
    position: player.position,
    secondary_position: player.secondary_position,
    preferred_foot: player.preferred_foot,
    jersey_number: player.jersey_number,
    player_photo: player.player_photo,
    height: player.height,
    weight: player.weight,
    medical_notes: player.medical_notes,
  };
}

function EditPlayerPage() {
  const { playerId } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => fetchPlayer(playerId),
  });
  const { data: currentPhotoUrl } = useQuery({
    queryKey: ["player-photo", data?.player.player_photo],
    queryFn: () => photoUrl(data?.player.player_photo ?? null),
    enabled: Boolean(data?.player.player_photo),
  });
  const [player, setPlayer] = useState<PlayerInput | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.player) setPlayer(playerInputFromPlayer(data.player));
  }, [data?.player]);

  const set = <K extends keyof PlayerInput>(key: K, value: PlayerInput[K]) =>
    setPlayer((current) => (current ? { ...current, [key]: value } : current));

  const field = (label: string, key: keyof PlayerInput, type = "text") => (
    <div className="grid gap-2" key={key}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={(player?.[key] as string | number | null) ?? ""}
        onChange={(event) =>
          set(
            key,
            (type === "number"
              ? event.target.value
                ? Number(event.target.value)
                : null
              : event.target.value || null) as PlayerInput[typeof key],
          )
        }
      />
    </div>
  );

  if (isLoading || !player) return <LoadingBlock label="Loading player details…" />;

  if (isError || !data) {
    return (
      <div className="grid gap-4">
        <Link
          to="/admin/players"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to players
        </Link>
        <p className="text-muted-foreground">This player could not be found.</p>
      </div>
    );
  }

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
      await updatePlayer(playerId, { ...player, player_photo: photoPath });
      const original = playerInputFromPlayer(data.player);
      const changedFields = (Object.keys(player) as Array<keyof PlayerInput>).filter(
        (key) => player[key] !== original[key],
      );
      try {
        await logAdminActivity({
          action: "player_updated",
          entityType: "player",
          entityId: playerId,
          summary: `${player.first_name} ${player.last_name} profile updated`,
          metadata: { changedFields, photoUpdated: Boolean(photo) },
        });
      } catch (logError) {
        console.error("Could not record player update activity", logError);
      }
      await qc.invalidateQueries({ queryKey: ["players"] });
      await qc.invalidateQueries({ queryKey: ["player", playerId] });
      toast.success(`${player.first_name} ${player.last_name} updated.`);
      nav({ to: "/admin/players/$playerId", params: { playerId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update player.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/players/$playerId"
          params={{ playerId }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to player profile
        </Link>
        <Badge variant="outline">Admin information only</Badge>
      </div>
      <div>
        <h1 className="font-display text-2xl uppercase">Edit player</h1>
        <p className="text-muted-foreground text-sm">
          Update registration information. Player evaluations remain managed by coaches.
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
            <Select value={player.gender ?? ""} onValueChange={(value) => set("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
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
          <SelectField
            label="Primary position"
            value={player.position}
            options={POSITIONS}
            onChange={(value) => set("position", value)}
          />
          <SelectField
            label="Secondary position"
            value={player.secondary_position}
            options={POSITIONS}
            onChange={(value) => set("secondary_position", value)}
          />
          <SelectField
            label="Preferred foot"
            value={player.preferred_foot}
            options={PREFERRED_FOOT}
            onChange={(value) => set("preferred_foot", value)}
          />
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
          <SelectField
            label="Category / team"
            value={player.team_category}
            options={TEAM_CATEGORIES}
            onChange={(value) => set("team_category", value)}
          />
          {field("Jersey number", "jersey_number", "number")}
          {field("Height (cm)", "height", "number")}
          {field("Weight (kg)", "weight", "number")}
          <div className="grid gap-2 sm:col-span-2">
            <Label>Player photo</Label>
            {currentPhotoUrl && !photo && (
              <img
                src={currentPhotoUrl}
                alt={`${player.first_name} ${player.last_name}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <label className="border-border/70 hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm transition-colors">
              <Upload className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">
                {photo ? photo.name : "Choose a replacement photo (JPG, PNG, or WebP; max 5MB)"}
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
              onChange={(event) => set("medical_notes", event.target.value || null)}
              placeholder="Allergies, injuries, or relevant conditions"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={submit} disabled={saving} className="h-12">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save player information
      </Button>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="text-muted-foreground py-10 text-center">{label}</div>;
}

export default Route.component;
