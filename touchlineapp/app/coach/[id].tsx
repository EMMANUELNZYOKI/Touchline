import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { AcademyIdentity, MetricCard } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { deleteMobileCoach, fetchMobileCoaches, updateMobileCoach } from "@/lib/touchline/admin";
import { fetchMobileEvaluations, fetchMobilePlayers } from "@/lib/touchline/data";

const input =
  "mb-3 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-3.5 text-base text-white";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-[#1e3a52] py-3">
      <Text className="text-sm text-[#aab7c7]">{label}</Text>
      <Text className="max-w-[58%] text-right text-sm font-bold text-white">
        {value || "Not provided"}
      </Text>
    </View>
  );
}

export default function CoachDetailScreen() {
  const { context } = useTouchlineAuth();
  const client = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const coaches = useQuery({
    queryKey: ["mobile-coach-detail", context?.academy?.id],
    queryFn: () => fetchMobileCoaches(context!.academy!.id),
    enabled: Boolean(context?.academy && id),
  });
  const evaluations = useQuery({
    queryKey: ["mobile-coach-detail-evaluations", context?.academy?.id],
    queryFn: () => fetchMobileEvaluations(context!.academy!.id),
    enabled: Boolean(context?.academy && id),
  });
  const players = useQuery({
    queryKey: ["mobile-coach-detail-players", context?.academy?.id],
    queryFn: () => fetchMobilePlayers(context!.academy!.id),
    enabled: Boolean(context?.academy && id),
  });
  const coach = coaches.data?.find((item) => item.id === id);
  useEffect(() => {
    if (!coach) return;
    const timer = setTimeout(() => {
      setFullName(coach.full_name);
      setPhone(coach.phone ?? "");
    }, 0);
    return () => clearTimeout(timer);
  }, [coach]);
  const editMutation = useMutation({
    mutationFn: () =>
      updateMobileCoach({ coachId: id, full_name: fullName.trim(), phone: phone.trim() || null }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["mobile-coach-detail"] });
      await client.invalidateQueries({ queryKey: ["mobile-coaches"] });
      setEditOpen(false);
      setMessage(null);
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Coach details could not be updated."),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteMobileCoach(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["mobile-coaches"] });
      router.back();
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Coach could not be deleted."),
  });
  if (!context) return null;
  const coachEvaluations = (evaluations.data ?? []).filter((item) => item.coach_id === id);
  const evaluatedIds = new Set(coachEvaluations.map((item) => item.player_id));
  const evaluatedPlayers = (players.data ?? []).filter((player) => evaluatedIds.has(player.id));
  const canEdit = context.role === "academy_admin" || context.role === "academy_manager";
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
        {(coaches.isLoading || evaluations.isLoading || players.isLoading) && (
          <ActivityIndicator color="#78d4aa" />
        )}
        {!coach && !coaches.isLoading && (
          <Text className="rounded-2xl bg-[#4b2530] p-4 text-sm text-[#ffd7de]">
            This coach could not be found.
          </Text>
        )}
        {coach && (
          <>
            <View className="mb-5 flex-row items-center">
              <View className="mr-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#173f4a]">
                <Text className="text-xl font-black text-[#78d4aa]">
                  {coach.full_name.slice(0, 1)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-black text-white">{coach.full_name}</Text>
                <Text className="mt-1 text-sm text-[#aab7c7]">Coach profile</Text>
              </View>
              <Text
                className={
                  coach.status === "active"
                    ? "font-bold text-[#78d4aa]"
                    : "font-bold text-[#f2c36b]"
                }
              >
                {coach.status}
              </Text>
            </View>
            {canEdit && (
              <View className="mb-5 flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setMessage(null);
                    setEditOpen(true);
                  }}
                  className="flex-1 rounded-2xl bg-[#78d4aa] p-4"
                >
                  <Text className="text-center font-black text-[#071521]">Edit coach details</Text>
                </Pressable>
                {(context.role === "academy_admin" || context.role === "academy_manager") && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete coach"
                    onPress={() =>
                      Alert.alert(
                        `Delete ${coach.full_name}?`,
                        "The coach account will be permanently removed. Player records will remain in the academy without an assigned coach.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteMutation.mutate(),
                          },
                        ],
                      )
                    }
                    disabled={deleteMutation.isPending}
                    className="w-14 items-center justify-center rounded-2xl border border-[#7d3b49] bg-[#4b2530]"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ffd7de" />
                  </Pressable>
                )}
              </View>
            )}
            <View className="mb-5 flex-row gap-3">
              <MetricCard
                label="Players evaluated"
                value={String(evaluatedPlayers.length)}
                icon="people-outline"
              />
              <MetricCard
                label="Evaluations"
                value={String(coachEvaluations.length)}
                icon="clipboard-outline"
                accent="#8bb8ff"
              />
            </View>
            <View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
              <Text className="mb-2 text-base font-black text-white">Account details</Text>
              <Row label="Coach name" value={coach.full_name} />
              <Row label="Email" value={coach.email} />
              <Row label="Phone" value={coach.phone ?? "Not provided"} />
              <Row
                label="Account status"
                value={coach.status === "active" ? "Active" : "Inactive"}
              />
              <Row label="Date created" value={new Date(coach.created_at).toLocaleDateString()} />
            </View>
            <Text className="mb-3 text-lg font-black text-white">Players evaluated</Text>
            {!evaluatedPlayers.length && (
              <Text className="mb-5 rounded-2xl border border-dashed border-[#2b4862] p-5 text-sm text-[#aab7c7]">
                This coach has not evaluated any players yet.
              </Text>
            )}
            {evaluatedPlayers.map((player) => (
              <Pressable
                key={player.id}
                onPress={() => router.push({ pathname: "/player/[id]", params: { id: player.id } })}
                className="mb-2 flex-row items-center rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"
              >
                <View className="flex-1">
                  <Text className="font-bold text-white">
                    {player.first_name} {player.last_name}
                  </Text>
                  <Text className="mt-1 text-xs text-[#aab7c7]">
                    {player.position || "Position not set"}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-[#78d4aa]">View player</Text>
              </Pressable>
            ))}
            <Text className="mb-3 mt-5 text-lg font-black text-white">
              Recent evaluation activity
            </Text>
            {coachEvaluations.slice(0, 10).map((evaluation) => (
              <View
                key={evaluation.id}
                className="mb-2 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"
              >
                <View className="flex-row justify-between">
                  <Text className="font-bold text-white">{evaluation.playerName}</Text>
                  <Text className="font-bold text-[#78d4aa]">
                    {evaluation.overall_rating == null
                      ? "No rating"
                      : `Overall ${evaluation.overall_rating.toFixed(1)}`}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-[#aab7c7]">
                  {evaluation.season} {evaluation.season_year} ·{" "}
                  {new Date(evaluation.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <Modal
        visible={editOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="rounded-t-3xl bg-[#071521] p-5 pb-8">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-white">Edit coach</Text>
              <Pressable onPress={() => setEditOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={25} color="#aab7c7" />
              </Pressable>
            </View>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#71839a"
              maxLength={120}
              className={input}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              placeholderTextColor="#71839a"
              keyboardType="phone-pad"
              maxLength={40}
              className={input}
            />
            <TextInput
              value={coach?.email ?? ""}
              editable={false}
              placeholder="Email (cannot be changed)"
              placeholderTextColor="#71839a"
              className={`${input} opacity-60`}
            />
            {message && (
              <Text className="mb-3 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm leading-5 text-[#ffd7de]">
                {message}
              </Text>
            )}
            <Pressable
              disabled={editMutation.isPending}
              onPress={() => {
                if (fullName.trim().length < 2) {
                  setMessage("Full name must contain at least 2 characters.");
                  return;
                }
                editMutation.mutate();
              }}
              className="rounded-2xl bg-[#78d4aa] px-4 py-4"
              style={{ opacity: editMutation.isPending ? 0.6 : 1 }}
            >
              <Text className="text-center font-black text-[#071521]">
                {editMutation.isPending ? "Saving…" : "Save changes"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
