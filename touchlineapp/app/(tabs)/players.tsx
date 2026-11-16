import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { createMobilePlayer, fetchMobilePlayers } from "@/lib/touchline/data";

const inputClass = "mb-3 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-3.5 text-base text-white";

export default function PlayersScreen() {
  const { context } = useTouchlineAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teamCategory, setTeamCategory] = useState("");
  const [season, setSeason] = useState("");
  const [position, setPosition] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const playersQuery = useQuery({
    queryKey: ["mobile-players", context?.academy?.id],
    queryFn: fetchMobilePlayers,
    enabled: Boolean(context?.academy),
  });
  const createMutation = useMutation({
    mutationFn: createMobilePlayer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-players"] });
      setFormOpen(false);
      setFirstName("");
      setLastName("");
      setTeamCategory("");
      setSeason("");
      setPosition("");
      setFormMessage(null);
    },
    onError: (error) => setFormMessage(error instanceof Error ? error.message : "Player could not be created."),
  });

  if (!context) return null;
  const canCreate = context.role === "academy_admin" || context.role === "academy_manager";
  const canWrite = context.academy?.status === "active" && context.subscription?.status !== "past_due" && context.subscription?.status !== "canceled";
  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setFormMessage("First name and last name are required.");
      return;
    }
    setFormMessage(null);
    createMutation.mutate({ first_name: firstName, last_name: lastName, team_category: teamCategory, season, position });
  };

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity name={context.academy?.name ?? "Touchline Platform"} role={context.role} userName={context.profile.full_name} />
        <View className="mb-5 flex-row items-end justify-between">
          <View className="flex-1 pr-4"><Text className="text-2xl font-black text-white">Players</Text><Text className="mt-2 text-sm leading-5 text-[#aab7c7]">Player profiles, teams, seasons, and development status from your shared workspace.</Text></View>
          {canCreate && <Pressable onPress={() => setFormOpen(true)} disabled={!canWrite} className="h-12 w-12 items-center justify-center rounded-2xl bg-[#78d4aa] active:opacity-80" style={{ opacity: canWrite ? 1 : 0.45 }}><Ionicons name="add" size={26} color="#071521" /></Pressable>}
        </View>

        {playersQuery.isLoading && <View className="items-center py-12"><ActivityIndicator size="large" color="#78d4aa" /><Text className="mt-3 text-sm text-[#aab7c7]">Loading player records…</Text></View>}
        {playersQuery.error && <View className="rounded-2xl border border-[#683344] bg-[#3b2430] p-4"><Text className="text-sm leading-5 text-[#ffd7de]">Players could not be loaded. Check the academy membership and try again.</Text></View>}
        {!playersQuery.isLoading && !playersQuery.error && playersQuery.data?.length === 0 && <View className="items-center rounded-3xl border border-dashed border-[#2b4862] bg-[#10263a] px-5 py-12"><Ionicons name="people-outline" size={34} color="#78d4aa" /><Text className="mt-4 text-lg font-bold text-white">No players yet</Text><Text className="mt-2 text-center text-sm leading-5 text-[#aab7c7]">{canCreate ? "Tap + to add the first player to this academy." : "Your academy team will appear here once players are added."}</Text></View>}
        {playersQuery.data?.map((player) => (
          <View key={player.id} className="mb-3 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#173f4a]"><Text className="text-base font-black text-[#78d4aa]">{player.first_name[0]}{player.last_name[0]}</Text></View>
              <View className="flex-1"><Text className="text-base font-bold text-white">{player.first_name} {player.last_name}</Text><Text className="mt-1 text-xs text-[#aab7c7]">{player.position || "Position not set"} • {player.team_category || "Team not set"}</Text></View>
              <View className="items-end"><Text className="text-xs font-semibold text-[#aab7c7]">{player.season || "No season"}</Text><Ionicons name={player.hasEvaluation ? "checkmark-circle" : "ellipse-outline"} size={18} color={player.hasEvaluation ? "#78d4aa" : "#71839a"} /></View>
            </View>
            <View className="mt-3 flex-row items-center border-t border-[#1e3a52] pt-3"><Ionicons name="person-outline" size={14} color="#71839a" /><Text className="ml-2 text-xs text-[#aab7c7]">Coach: {player.coachName}</Text></View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView className="flex-1 justify-end bg-black/60" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="rounded-t-[30px] border-t border-[#2b4862] bg-[#071521] px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between"><View><Text className="text-xl font-black text-white">Add player</Text><Text className="mt-1 text-sm text-[#aab7c7]">This record will be shared with the web app.</Text></View><Pressable onPress={() => setFormOpen(false)} className="h-10 w-10 items-center justify-center rounded-full bg-[#10263a]"><Ionicons name="close" size={21} color="#aab7c7" /></Pressable></View>
            <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#71839a" className={inputClass} />
            <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#71839a" className={inputClass} />
            <View className="flex-row gap-3"><TextInput value={teamCategory} onChangeText={setTeamCategory} placeholder="Category / team" placeholderTextColor="#71839a" className={inputClass + " flex-1"} /><TextInput value={position} onChangeText={setPosition} placeholder="Position" placeholderTextColor="#71839a" className={inputClass + " flex-1"} /></View>
            <TextInput value={season} onChangeText={setSeason} placeholder="Season (for example January to May)" placeholderTextColor="#71839a" className={inputClass} />
            {formMessage && <Text className="mb-3 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm leading-5 text-[#ffd7de]">{formMessage}</Text>}
            <Pressable onPress={submit} disabled={createMutation.isPending} className="min-h-[54px] items-center justify-center rounded-2xl bg-[#78d4aa] active:opacity-80" style={{ opacity: createMutation.isPending ? 0.6 : 1 }}>{createMutation.isPending ? <ActivityIndicator color="#071521" /> : <Text className="font-black text-[#071521]">Save player</Text>}</Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
