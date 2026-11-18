import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import {
  fetchMobileAdminActivity,
  fetchMobileEvaluations,
  fetchMobilePlayers,
} from "@/lib/touchline/data";

export default function ActivityScreen() {
  const { context } = useTouchlineAuth();
  const players = useQuery({
    queryKey: ["mobile-activity-players", context?.academy?.id],
    queryFn: () => fetchMobilePlayers(context!.academy!.id),
    enabled: Boolean(context?.academy),
  });
  const evaluations = useQuery({
    queryKey: ["mobile-activity-evaluations", context?.academy?.id],
    queryFn: () => fetchMobileEvaluations(context!.academy!.id),
    enabled: Boolean(context?.academy),
  });
  const adminActivity = useQuery({
    queryKey: ["mobile-admin-activity", context?.academy?.id],
    queryFn: () => fetchMobileAdminActivity(context!.academy!.id),
    enabled: context?.role === "academy_admin" || context?.role === "academy_manager",
  });

  if (!context) return null;
  const activityEnabled = context.entitlements?.features.includes("activity_history") ?? false;
  if (!activityEnabled) {
    return (
      <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
          <AcademyIdentity
            name={context.academy?.name ?? "Touchline Academy"}
            role={context.role}
            userName={context.profile.full_name}
          />
          <Text className="text-2xl font-black text-white">Activity unavailable</Text>
          <Text className="mt-2 rounded-2xl border border-[#2b4862] bg-[#10263a] p-4 text-sm leading-5 text-[#aab7c7]">
            Activity history is not included in this academy package. Contact the Academy Owner if
            you need access.
          </Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const entries = [
    ...(players.data ?? []).map((player) => ({
      id: `player-${player.id}`,
      title: `${player.first_name} ${player.last_name} registered`,
      detail: `${player.position || "No position"} · ${player.coachName}`,
      at: player.created_at,
    })),
    ...(evaluations.data ?? []).map((evaluation) => ({
      id: `evaluation-${evaluation.id}`,
      title: `${evaluation.playerName} evaluated`,
      detail: `Rating ${evaluation.overall_rating?.toFixed(1) ?? "—"}/10 · by ${evaluation.coachName}`,
      at: evaluation.created_at,
    })),
    ...(adminActivity.data ?? []).map((entry) => ({
      id: `admin-${entry.id}`,
      title: entry.summary,
      detail: entry.entity_type === "player" ? "Player record" : "Coach account",
      at: entry.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 50);

  const loading = players.isLoading || evaluations.isLoading || adminActivity.isLoading;
  const error = players.error ?? evaluations.error ?? adminActivity.error;

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Academy"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <Text className="text-2xl font-black text-white">Activity</Text>
        <Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">
          Recent registrations, evaluations, and admin actions from your shared Touchline workspace.
        </Text>
        {loading && <ActivityIndicator color="#78d4aa" />}
        {error && (
          <Text className="mb-4 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm text-[#ffd7de]">
            {error instanceof Error ? error.message : "Activity could not be loaded."}
          </Text>
        )}
        {entries.map((entry) => (
          <View
            key={entry.id}
            className="mb-3 flex-row items-start rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#173f4a]">
              <Text className="text-lg text-[#78d4aa]">•</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">{entry.title}</Text>
              <Text className="mt-1 text-xs leading-5 text-[#aab7c7]">{entry.detail}</Text>
              <Text className="mt-1 text-[10px] text-[#71839a]">
                {new Date(entry.at).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
        {!loading && !error && entries.length === 0 && (
          <Text className="py-10 text-center text-sm text-[#aab7c7]">No activity yet.</Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
