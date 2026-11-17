import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { AcademyIdentity, MetricCard } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { fetchMobileEvaluations } from "@/lib/touchline/data";

export default function HistoryScreen() {
  const { context } = useTouchlineAuth();
  const query = useQuery({
    queryKey: ["mobile-coach-history", context?.academy?.id, context?.profile.id],
    queryFn: () => fetchMobileEvaluations(context!.academy!.id),
    enabled: Boolean(context?.academy),
  });
  if (!context) return null;
  const evaluations = (query.data ?? [])
    .filter((item) => item.coach_id === context.profile.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const rated = evaluations.filter((item) => item.overall_rating != null);
  const average = rated.length
    ? rated.reduce((sum, item) => sum + (item.overall_rating ?? 0), 0) / rated.length
    : 0;
  const month = new Date().toISOString().slice(0, 7);
  const distinctPlayers = new Set(evaluations.map((item) => item.player_id)).size;
  const thisMonth = evaluations.filter((item) => item.created_at.slice(0, 7) === month).length;
  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} className="mb-5 flex-row items-center">
          <Ionicons name="arrow-back" size={20} color="#78d4aa" />
          <Text className="ml-2 font-bold text-[#d5f5e5]">Back</Text>
        </Pressable>
        <AcademyIdentity name={context.academy?.name ?? "Touchline Academy"} role={context.role} userName={context.profile.full_name} />
        <Text className="text-2xl font-black uppercase text-white">My evaluation history</Text>
        <Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">Your submitted evaluations and performance summary. Other coaches’ evaluations are not included.</Text>
        <View className="mb-3 flex-row gap-3">
          <MetricCard label="Submitted" value={String(evaluations.length)} icon="clipboard-outline" />
          <MetricCard label="Players" value={String(distinctPlayers)} icon="people-outline" accent="#8bb8ff" />
        </View>
        <View className="mb-6 flex-row gap-3">
          <MetricCard label="Average" value={average ? `${average.toFixed(1)}/10` : "—"} icon="star-outline" accent="#f2c36b" />
          <MetricCard label="This month" value={String(thisMonth)} icon="calendar-outline" accent="#dca7ff" />
        </View>
        {query.isLoading && <ActivityIndicator color="#78d4aa" />}
        {query.error && <Text className="mb-4 rounded-2xl bg-[#4b2530] p-4 text-sm text-[#ffd7de]">{query.error instanceof Error ? query.error.message : "History could not be loaded."}</Text>}
        {!query.isLoading && evaluations.length === 0 && <View className="rounded-3xl border border-dashed border-[#2b4862] bg-[#10263a] p-8"><Text className="text-center text-lg font-bold text-white">No evaluations yet</Text><Text className="mt-2 text-center text-sm leading-5 text-[#aab7c7]">Evaluations you submit for registered players will appear here with your personal statistics.</Text></View>}
        {evaluations.map((evaluation) => (
          <View key={evaluation.id} className="mb-3 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-base font-bold text-white">{evaluation.playerName}</Text>
                <Text className="mt-1 text-xs text-[#aab7c7]">{evaluation.season} · {evaluation.season_year} · {new Date(evaluation.created_at).toLocaleDateString()}</Text>
              </View>
              <View className="items-center rounded-xl bg-[#173f4a] px-3 py-2"><Text className="text-[10px] uppercase text-[#aab7c7]">Overall</Text><Text className="text-lg font-black text-[#78d4aa]">{evaluation.overall_rating == null ? "—" : evaluation.overall_rating.toFixed(1)}</Text></View>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {[['Technical', evaluation.technical_score], ['Tactical', evaluation.tactical_score], ['Physical', evaluation.physical_score], ['Character', evaluation.personality_score]].map(([label, value]) => <View key={String(label)} className="rounded-xl bg-[#0b1c2d] px-3 py-2"><Text className="text-[9px] uppercase text-[#aab7c7]">{label}</Text><Text className="mt-1 font-bold text-white">{typeof value === "number" ? value.toFixed(1) : "—"}</Text></View>)}
            </View>
            <Text className="mt-3 text-sm font-bold text-[#78d4aa]">Verdict: {evaluation.coach_verdict ?? "—"}</Text>
            {evaluation.development_goals && <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">Development goals: {evaluation.development_goals}</Text>}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
