import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { fetchMobileEvaluations, fetchMobilePlayers } from "@/lib/touchline/data";

export default function ActivityScreen() {
  const { context } = useTouchlineAuth();
  const players = useQuery({ queryKey: ["mobile-activity-players", context?.academy?.id], queryFn: () => fetchMobilePlayers(context!.academy!.id), enabled: Boolean(context?.academy) });
  const evaluations = useQuery({ queryKey: ["mobile-activity-evaluations", context?.academy?.id], queryFn: () => fetchMobileEvaluations(context!.academy!.id), enabled: Boolean(context?.academy) });
  if (!context) return null;
  const entries = [...(players.data ?? []).map((player) => ({ id: `player-${player.id}`, title: `${player.first_name} ${player.last_name} registered`, detail: `${player.position || "No position"} · ${player.team_category || "No team"}`, at: "" })), ...(evaluations.data ?? []).map((evaluation) => ({ id: `evaluation-${evaluation.id}`, title: `${evaluation.playerName} evaluated`, detail: `Rating ${evaluation.overall_rating?.toFixed(1) ?? "—"}/10 · by ${evaluation.coachName}`, at: evaluation.created_at }))].slice(0, 50);
  return <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}><AcademyIdentity name={context.academy?.name ?? "Touchline Academy"} role={context.role} userName={context.profile.full_name} /><Text className="text-2xl font-black text-white">Activity</Text><Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">Recent registrations and evaluations from your shared Touchline workspace.</Text>{(players.isLoading || evaluations.isLoading) && <ActivityIndicator color="#78d4aa" />}{entries.map((entry) => <View key={entry.id} className="mb-3 flex-row items-start rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"><View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#173f4a]"><Text className="text-lg text-[#78d4aa]">•</Text></View><View className="flex-1"><Text className="text-sm font-bold text-white">{entry.title}</Text><Text className="mt-1 text-xs leading-5 text-[#aab7c7]">{entry.detail}</Text></View></View>)}{!players.isLoading && !evaluations.isLoading && entries.length === 0 && <Text className="py-10 text-center text-sm text-[#aab7c7]">No activity yet.</Text>}</ScrollView></ScreenContainer>;
}
