import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { fetchMobilePlayerDetail, fetchMobileSignedPhotoUrl } from "@/lib/touchline/data";

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View className="flex-row justify-between border-b border-[#1e3a52] py-3">
      <Text className="text-sm text-[#aab7c7]">{label}</Text>
      <Text className="max-w-[58%] text-right text-sm font-bold text-white">
        {value || "Not provided"}
      </Text>
    </View>
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function PlayerDetailScreen() {
  const { context } = useTouchlineAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [downloading, setDownloading] = useState(false);
  const query = useQuery({
    queryKey: ["mobile-player-detail", context?.academy?.id, id],
    queryFn: () => fetchMobilePlayerDetail(context!.academy!.id, id),
    enabled: Boolean(context?.academy && id),
  });
  const photoQuery = useQuery({
    queryKey: ["mobile-player-photo", query.data?.player.player_photo],
    queryFn: () => fetchMobileSignedPhotoUrl(query.data?.player.player_photo ?? null),
    enabled: Boolean(query.data?.player.player_photo),
  });

  if (!context) return null;
  const player = query.data?.player;
  const evaluations = query.data?.evaluations ?? [];
  const latestEvaluation = query.data?.latestEvaluation;

  const downloadEvaluation = async () => {
    if (!player || evaluations.length === 0) {
      Alert.alert(
        "No evaluation available",
        "This player does not have an evaluation to download yet.",
      );
      return;
    }
    setDownloading(true);
    try {
      if (Platform.OS === "web") {
        await Linking.openURL(
          `https://touchlineelite.vercel.app/admin/players/${encodeURIComponent(player.id)}`,
        );
        return;
      }
      const evaluation = evaluations[0];
      const playerName = `${player.first_name} ${player.last_name}`.trim();
      const scoreRow = (label: string, value: number | null | undefined) =>
        `<tr><td>${escapeHtml(label)}</td><td>${value == null ? "—" : `${Number(value).toFixed(1)}/10`}</td></tr>`;
      const note = (label: string, value: string | null | undefined) =>
        value ? `<p class="note"><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</p>` : "";
      const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /><style>body{font-family:Arial,sans-serif;color:#17202f;padding:32px}h1{margin:0 0 4px;color:#173f4a}h2{margin-top:28px;color:#173f4a;border-bottom:2px solid #d6b45a;padding-bottom:6px}.meta{color:#5c6b7a;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin:14px 0}td{border-bottom:1px solid #d9e0e5;padding:9px;text-align:left}td:last-child{text-align:right;font-weight:700}.rating{font-size:28px;color:#173f4a;font-weight:700}.note{line-height:1.5;margin:8px 0}</style></head><body><h1>Touchline Player Evaluation</h1><div class="meta">${escapeHtml(playerName)} · ${escapeHtml(player.position || "Position not set")} · ${escapeHtml(player.team_category || "Team not set")}</div><div class="rating">Overall rating: ${evaluation.overall_rating == null ? "—" : `${Number(evaluation.overall_rating).toFixed(1)}/10`}</div><div class="meta">${escapeHtml(evaluation.season)} ${escapeHtml(evaluation.season_year)} · Evaluated by ${escapeHtml(evaluation.coachName)} · ${escapeHtml(new Date(evaluation.created_at).toLocaleDateString())}</div><h2>Scores</h2><table>${scoreRow("Technical", evaluation.technical_score)}${scoreRow("Tactical", evaluation.tactical_score)}${scoreRow("Physical", evaluation.physical_score)}${scoreRow("Mindset", evaluation.personality_score)}</table><h2>Assessment</h2>${note("Verdict", evaluation.coach_verdict)}${note("Strengths", evaluation.strengths)}${note("Focus", evaluation.weaknesses)}${note("Development goals", evaluation.development_goals)}${note("Coach notes", evaluation.coach_notes)}</body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (!FileSystem.cacheDirectory) {
        throw new Error(
          "This device does not provide a writable cache directory for the evaluation PDF.",
        );
      }
      const cachedUri = `${FileSystem.cacheDirectory}touchline-evaluation-${Date.now()}.pdf`;
      await FileSystem.copyAsync({ from: file.uri, to: cachedUri });
      if (await Sharing.isAvailableAsync()) {
        const shareUri =
          Platform.OS === "android" ? await FileSystem.getContentUriAsync(cachedUri) : cachedUri;
        await Sharing.shareAsync(shareUri, {
          mimeType: "application/pdf",
          dialogTitle: `Download ${playerName} evaluation`,
        });
      } else {
        Alert.alert(
          "Evaluation PDF ready",
          "Your device does not provide a sharing sheet for saving this PDF.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Download failed",
        error instanceof Error ? error.message : "The evaluation PDF could not be prepared.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} className="mb-5 flex-row items-center">
          <Ionicons name="arrow-back" size={20} color="#78d4aa" />
          <Text className="ml-2 font-bold text-[#d5f5e5]">Back</Text>
        </Pressable>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Academy"}
          role={context.role}
          userName={context.profile.full_name}
        />
        {query.isLoading && <ActivityIndicator color="#78d4aa" />}
        {query.error && (
          <Text className="rounded-2xl bg-[#4b2530] p-4 text-sm text-[#ffd7de]">
            {query.error instanceof Error ? query.error.message : "Player could not be loaded."}
          </Text>
        )}
        {player && (
          <>
            <View className="mb-5 flex-row items-center">
              <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#173f4a]">
                {photoQuery.data ? (
                  <Image source={{ uri: photoQuery.data }} style={{ width: 64, height: 64 }} />
                ) : (
                  <Text className="text-xl font-black text-[#78d4aa]">
                    {player.first_name[0]}
                    {player.last_name[0]}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-black text-white">
                  {player.first_name} {player.last_name}
                </Text>
                <Text className="mt-1 text-sm text-[#aab7c7]">
                  {player.position || "Position not set"} · {player.team_category || "Team not set"}
                </Text>
              </View>
              {context.role !== "coach" && (
                <Pressable
                  disabled={downloading || evaluations.length === 0}
                  onPress={() => void downloadEvaluation()}
                  className="ml-2 items-center rounded-xl bg-[#f2c36b] px-3 py-2"
                  style={{
                    maxWidth: 122,
                    opacity: downloading || evaluations.length === 0 ? 0.55 : 1,
                  }}
                >
                  <Ionicons name="download-outline" size={17} color="#2b281e" />
                  <Text className="mt-1 text-center text-[10px] font-black text-[#2b281e]">
                    {downloading ? "Preparing…" : "Download evaluation"}
                  </Text>
                </Pressable>
              )}
            </View>
            {context.role === "academy_admin" && (
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/(tabs)/players", params: { editId: player.id } })
                }
                className="mb-5 rounded-2xl bg-[#78d4aa] p-4"
              >
                <Text className="text-center font-black text-[#071521]">
                  Edit player information
                </Text>
              </Pressable>
            )}
            {context.role === "coach" &&
              (latestEvaluation ? (
                latestEvaluation.coach_id === context.profile.id ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/evaluations",
                        params: { playerId: player.id, updateId: latestEvaluation.id },
                      })
                    }
                    className="mb-5 rounded-2xl bg-[#78d4aa] p-4"
                  >
                    <Text className="text-center font-black text-[#071521]">Update Evaluation</Text>
                  </Pressable>
                ) : (
                  <View className="mb-5 rounded-2xl border border-[#7d3b49] bg-[#4b2530] p-4">
                    <Text className="font-black text-[#ffd7de]">Already evaluated</Text>
                    <Text className="mt-1 text-sm leading-5 text-[#ffd7de]">
                      Another coach has completed this player&apos;s evaluation. No additional
                      evaluation is needed.
                    </Text>
                  </View>
                )
              ) : (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/evaluations",
                      params: { playerId: player.id },
                    })
                  }
                  className="mb-5 rounded-2xl bg-[#78d4aa] p-4"
                >
                  <Text className="text-center font-black text-[#071521]">Update Evaluation</Text>
                </Pressable>
              ))}
            <View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
              <Text className="mb-2 text-base font-black text-white">Player profile</Text>
              <Row label="Date of birth" value={player.date_of_birth} />
              <Row label="Gender" value={player.gender} />
              <Row label="Season" value={player.season} />
              <Row label="Secondary position" value={player.secondary_position} />
              <Row label="Preferred foot" value={player.preferred_foot} />
              <Row label="Jersey number" value={player.jersey_number} />
              <Row label="Height" value={player.height ? `${player.height} cm` : null} />
              <Row label="Weight" value={player.weight ? `${player.weight} kg` : null} />
              <Row label="Player phone" value={player.phone} />
              <Row label="Parent / guardian" value={player.parent_name} />
              <Row label="Emergency contact" value={player.emergency_contact} />
              <Row label="Assigned coach" value={player.coachName} />
            </View>
            {player.medical_notes && (
              <View className="mb-5 rounded-3xl border border-[#683344] bg-[#3b2430] p-5">
                <Text className="text-base font-black text-[#ffd7de]">Medical notes</Text>
                <Text className="mt-2 text-sm leading-5 text-[#ffd7de]">
                  {player.medical_notes}
                </Text>
              </View>
            )}
            <Text className="mb-3 text-lg font-black text-white">Evaluation history</Text>
            {!evaluations.length && (
              <Text className="rounded-2xl border border-dashed border-[#2b4862] p-5 text-sm text-[#aab7c7]">
                No evaluation has been recorded yet.
              </Text>
            )}
            {evaluations.map((evaluation) => (
              <View
                key={evaluation.id}
                className="mb-3 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"
              >
                <View className="flex-row justify-between">
                  <Text className="font-bold text-white">
                    {evaluation.season} {evaluation.season_year}
                  </Text>
                  <Text className="font-black text-[#78d4aa]">
                    {evaluation.overall_rating?.toFixed(1) ?? "—"}/10
                  </Text>
                </View>
                <Text className="mt-2 text-xs text-[#aab7c7]">
                  By {evaluation.coachName} · {new Date(evaluation.created_at).toLocaleDateString()}
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {[
                    ["Technical", evaluation.technical_score],
                    ["Tactical", evaluation.tactical_score],
                    ["Physical", evaluation.physical_score],
                    ["Mindset", evaluation.personality_score],
                  ].map(([label, value]) => (
                    <View key={String(label)} className="rounded-xl bg-[#0b1c2d] px-3 py-2">
                      <Text className="text-[9px] uppercase text-[#aab7c7]">{String(label)}</Text>
                      <Text className="mt-1 font-bold text-white">
                        {typeof value === "number" ? value.toFixed(1) : "—"}
                      </Text>
                    </View>
                  ))}
                </View>
                {evaluation.coach_verdict && (
                  <Text className="mt-2 text-sm font-bold text-[#78d4aa]">
                    Verdict: {evaluation.coach_verdict}
                  </Text>
                )}
                {evaluation.strengths && (
                  <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
                    Strengths: {evaluation.strengths}
                  </Text>
                )}
                {evaluation.weaknesses && (
                  <Text className="mt-1 text-sm leading-5 text-[#aab7c7]">
                    Focus: {evaluation.weaknesses}
                  </Text>
                )}
                {evaluation.development_goals && (
                  <Text className="mt-1 text-sm leading-5 text-[#aab7c7]">
                    Development goals: {evaluation.development_goals}
                  </Text>
                )}
                {evaluation.coach_notes && (
                  <Text className="mt-1 text-sm leading-5 text-[#aab7c7]">
                    Coach notes: {evaluation.coach_notes}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
