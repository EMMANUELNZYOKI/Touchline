import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { fetchMobilePlayerDetail } from "@/lib/touchline/data";

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <View className="flex-row justify-between border-b border-[#1e3a52] py-3"><Text className="text-sm text-[#aab7c7]">{label}</Text><Text className="max-w-[58%] text-right text-sm font-bold text-white">{value || "Not provided"}</Text></View>;
}
export default function PlayerDetailScreen() {
  const { context } = useTouchlineAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["mobile-player-detail", context?.academy?.id, id], queryFn: () => fetchMobilePlayerDetail(context!.academy!.id, id), enabled: Boolean(context?.academy && id) });
  if (!context) return null;
  const player = query.data?.player;
  return <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
    <Pressable onPress={() => router.back()} className="mb-5 flex-row items-center"><Ionicons name="arrow-back" size={20} color="#78d4aa" /><Text className="ml-2 font-bold text-[#d5f5e5]">Back</Text></Pressable>
    <AcademyIdentity name={context.academy?.name ?? "Touchline Academy"} role={context.role} userName={context.profile.full_name} />
    {query.isLoading && <ActivityIndicator color="#78d4aa" />}
    {query.error && <Text className="rounded-2xl bg-[#4b2530] p-4 text-sm text-[#ffd7de]">{query.error instanceof Error ? query.error.message : "Player could not be loaded."}</Text>}
    {player && <>
      <View className="mb-5 flex-row items-center"><View className="mr-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#173f4a]"><Text className="text-xl font-black text-[#78d4aa]">{player.first_name[0]}{player.last_name[0]}</Text></View><View className="flex-1"><Text className="text-2xl font-black text-white">{player.first_name} {player.last_name}</Text><Text className="mt-1 text-sm text-[#aab7c7]">{player.position || "Position not set"} · {player.team_category || "Team not set"}</Text></View></View>
      {context.role === "academy_admin" && <Pressable onPress={() => router.push({ pathname: "/(tabs)/players", params: { editId: player.id } })} className="mb-5 rounded-2xl bg-[#78d4aa] p-4"><Text className="text-center font-black text-[#071521]">Edit player information</Text></Pressable>}
      <View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5"><Text className="mb-2 text-base font-black text-white">Player profile</Text><Row label="Date of birth" value={player.date_of_birth} /><Row label="Gender" value={player.gender} /><Row label="Season" value={player.season} /><Row label="Secondary position" value={player.secondary_position} /><Row label="Preferred foot" value={player.preferred_foot} /><Row label="Jersey number" value={player.jersey_number} /><Row label="Height" value={player.height ? `${player.height} cm` : null} /><Row label="Weight" value={player.weight ? `${player.weight} kg` : null} /><Row label="Player phone" value={player.phone} /><Row label="Parent / guardian" value={player.parent_name} /><Row label="Emergency contact" value={player.emergency_contact} /><Row label="Assigned coach" value={player.coachName} /></View>
      {player.medical_notes && <View className="mb-5 rounded-3xl border border-[#683344] bg-[#3b2430] p-5"><Text className="text-base font-black text-[#ffd7de]">Medical notes</Text><Text className="mt-2 text-sm leading-5 text-[#ffd7de]">{player.medical_notes}</Text></View>}
      <Text className="mb-3 text-lg font-black text-white">Evaluation history</Text>
      {!query.data?.evaluations.length && <Text className="rounded-2xl border border-dashed border-[#2b4862] p-5 text-sm text-[#aab7c7]">No evaluation has been recorded yet.</Text>}
      {query.data?.evaluations.map((evaluation) => <View key={evaluation.id} className="mb-3 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"><View className="flex-row justify-between"><Text className="font-bold text-white">{evaluation.season} {evaluation.season_year}</Text><Text className="font-black text-[#78d4aa]">{evaluation.overall_rating?.toFixed(1) ?? "—"}/10</Text></View><Text className="mt-2 text-xs text-[#aab7c7]">By {evaluation.coachName} · {new Date(evaluation.created_at).toLocaleDateString()}</Text>{evaluation.coach_verdict && <Text className="mt-2 text-sm font-bold text-[#78d4aa]">{evaluation.coach_verdict}</Text>}{evaluation.development_goals && <Text className="mt-1 text-sm leading-5 text-[#aab7c7]">{evaluation.development_goals}</Text>}</View>)}
    </>}
  </ScrollView></ScreenContainer>;
}
