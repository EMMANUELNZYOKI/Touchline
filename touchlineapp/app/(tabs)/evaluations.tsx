import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import {
  createMobileEvaluation,
  fetchMobileEvaluations,
  fetchMobilePlayers,
  type MobileEvaluation,
} from "@/lib/touchline/data";
import {
  emptyMobileSkillState,
  mobileAverageScore,
  mobileScoresFromSkills,
  mobileSkillStateFromEvaluation,
  MOBILE_SKILL_CATEGORIES,
  MOBILE_VERDICTS,
  type MobileAssessment,
  type MobileSkillCategoryKey,
  type MobileSkillState,
} from "@/lib/touchline/skills";

const COLORS = {
  background: "#071521",
  panel: "#10263a",
  field: "#0b1c2d",
  border: "#2b4862",
  green: "#78d4aa",
  white: "#ffffff",
  muted: "#aab7c7",
  red: "#ffd7de",
};

const blankAssessment = (): MobileAssessment => ({
  strengths: "",
  weaknesses: "",
  development_goals: "",
  coach_verdict: "",
  coach_notes: "",
});

function Score({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 72,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        backgroundColor: COLORS.panel,
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
      }}
    >
      <Text className="text-center text-[9px] font-semibold uppercase tracking-wider text-[#aab7c7]">
        {label}
      </Text>
      <Text className="mt-1 text-lg font-black text-[#78d4aa]">{value.toFixed(1)}</Text>
    </View>
  );
}

function AssessmentField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#aab7c7]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71839a"
        multiline
        maxLength={1000}
        textAlignVertical="top"
        style={{
          minHeight: 92,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          backgroundColor: COLORS.field,
          color: COLORS.white,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          lineHeight: 21,
        }}
      />
      <Text className="mt-1 text-right text-[10px] text-[#71839a]">{value.length}/1000</Text>
    </View>
  );
}

export default function EvaluationsScreen() {
  const { context } = useTouchlineAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MobileEvaluation | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [category, setCategory] = useState<MobileSkillCategoryKey>("technical");
  const [skills, setSkills] = useState<MobileSkillState>(emptyMobileSkillState());
  const [assessment, setAssessment] = useState<MobileAssessment>(blankAssessment);
  const [message, setMessage] = useState<string | null>(null);

  const evaluationsQuery = useQuery({
    queryKey: ["mobile-evaluations", context?.academy?.id, context?.role],
    queryFn: () => fetchMobileEvaluations(context!.academy!.id),
    enabled: Boolean(context?.academy),
  });
  const playersQuery = useQuery({
    queryKey: ["mobile-evaluation-players", context?.academy?.id, context?.profile.id],
    queryFn: () => fetchMobilePlayers(context!.academy!.id),
    enabled: Boolean(context?.academy),
  });
  const scores = useMemo(() => mobileScoresFromSkills(skills), [skills]);
  const selectedPlayer = playersQuery.data?.find((player) => player.id === playerId);
  const activePeriodSeason = selectedPlayer?.season?.trim() || "UNSPECIFIED";
  const activePeriodEvaluation = evaluationsQuery.data?.find(
    (evaluation) =>
      evaluation.player_id === playerId &&
      evaluation.season === activePeriodSeason &&
      evaluation.season_year === new Date().getFullYear(),
  );
  const hasOtherCurrentEvaluation =
    Boolean(activePeriodEvaluation) && activePeriodEvaluation?.coach_id !== context?.profile.id;
  const filteredPlayers = (playersQuery.data ?? []).filter((player) =>
    `${player.first_name} ${player.last_name}`
      .toLowerCase()
      .includes(playerSearch.trim().toLowerCase()),
  );

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
    setPlayerId("");
    setPlayerSearch("");
    setCategory("technical");
    setSkills(emptyMobileSkillState());
    setAssessment(blankAssessment());
    setMessage(null);
  };
  const openNew = () => {
    setEditing(null);
    setPlayerId("");
    setPlayerSearch("");
    setCategory("technical");
    setSkills(emptyMobileSkillState());
    setAssessment(blankAssessment());
    setMessage(null);
    setOpen(true);
  };
  const openEdit = (evaluation: MobileEvaluation) => {
    setEditing(evaluation);
    setPlayerId(evaluation.player_id);
    setPlayerSearch(evaluation.playerName);
    setCategory("technical");
    setSkills(mobileSkillStateFromEvaluation(evaluation));
    setAssessment({
      strengths: evaluation.strengths ?? "",
      weaknesses: evaluation.weaknesses ?? "",
      development_goals: evaluation.development_goals ?? "",
      coach_verdict: evaluation.coach_verdict ?? "",
      coach_notes: evaluation.coach_notes ?? "",
    });
    setMessage(null);
    setOpen(true);
  };
  const save = useMutation({
    mutationFn: () =>
      createMobileEvaluation({
        academy_id: context!.academy!.id,
        player_id: playerId,
        ...(editing ? { evaluation_id: editing.id } : {}),
        skills,
        assessment,
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["mobile-evaluations"] }),
        client.invalidateQueries({ queryKey: ["mobile-players"] }),
        client.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
        client.invalidateQueries({ queryKey: ["mobile-reports"] }),
      ]);
      closeForm();
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Evaluation could not be saved."),
  });

  if (!context) return null;
  const canCreate = context.role === "coach" && (context.entitlements?.canWrite ?? false);
  const setSkill = (key: MobileSkillCategoryKey, skill: string, value: number) => {
    setSkills((current) => ({
      ...current,
      [key]: { ...current[key], [skill]: Math.max(1, Math.min(10, value)) },
    }));
  };
  const choosePlayer = (nextPlayerId: string) => {
    setPlayerId(nextPlayerId);
    const nextPlayer = playersQuery.data?.find((player) => player.id === nextPlayerId);
    const season = nextPlayer?.season?.trim() || "UNSPECIFIED";
    const existing = evaluationsQuery.data?.find(
      (evaluation) =>
        evaluation.player_id === nextPlayerId &&
        evaluation.coach_id === context.profile.id &&
        evaluation.season === season &&
        evaluation.season_year === new Date().getFullYear(),
    );
    if (existing) {
      setEditing(existing);
      setSkills(mobileSkillStateFromEvaluation(existing));
      setAssessment({
        strengths: existing.strengths ?? "",
        weaknesses: existing.weaknesses ?? "",
        development_goals: existing.development_goals ?? "",
        coach_verdict: existing.coach_verdict ?? "",
        coach_notes: existing.coach_notes ?? "",
      });
    } else {
      setEditing(null);
      setSkills(emptyMobileSkillState());
      setAssessment(blankAssessment());
    }
    setMessage(null);
  };
  const submit = () => {
    if (!playerId) {
      setMessage("Choose a player before saving this evaluation.");
      return;
    }
    if (!assessment.coach_verdict) {
      setMessage("Choose a coach verdict before saving.");
      return;
    }
    if (hasOtherCurrentEvaluation && !editing) {
      setMessage(
        "Another coach has already evaluated this player for the current season and year.",
      );
      return;
    }
    setMessage(null);
    save.mutate();
  };

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Platform"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <View className="mb-5 flex-row items-end justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-2xl font-black text-white">Evaluations</Text>
            <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
              Full coach assessments and development history, shared with the website.
            </Text>
          </View>
          {canCreate && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create evaluation"
              onPress={openNew}
              style={{
                width: 52,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 17,
                backgroundColor: COLORS.green,
              }}
              hitSlop={6}
            >
              <Ionicons name="add" size={26} color={COLORS.background} />
            </Pressable>
          )}
        </View>
        {evaluationsQuery.isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text className="mt-3 text-sm text-[#aab7c7]">Loading evaluations…</Text>
          </View>
        )}
        {evaluationsQuery.error && (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#683344",
              backgroundColor: "#3b2430",
              padding: 16,
            }}
          >
            <Text className="text-sm text-[#ffd7de]">
              {evaluationsQuery.error instanceof Error
                ? evaluationsQuery.error.message
                : "Evaluations could not be loaded."}
            </Text>
            <Pressable
              onPress={() => void evaluationsQuery.refetch()}
              style={{ minHeight: 44, justifyContent: "center", marginTop: 8 }}
            >
              <Text className="font-bold text-[#78d4aa]">Retry</Text>
            </Pressable>
          </View>
        )}
        {!evaluationsQuery.isLoading &&
          !evaluationsQuery.error &&
          evaluationsQuery.data?.length === 0 && (
            <View className="items-center rounded-3xl border border-dashed border-[#2b4862] bg-[#10263a] px-5 py-12">
              <Ionicons name="clipboard-outline" size={34} color={COLORS.green} />
              <Text className="mt-4 text-lg font-bold text-white">No evaluations yet</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#aab7c7]">
                {canCreate
                  ? "Tap + to record a player's development assessment."
                  : "Coach assessments will appear here once recorded."}
              </Text>
            </View>
          )}
        {evaluationsQuery.data?.map((evaluation) => {
          const isOwn = evaluation.coach_id === context.profile.id;
          const allowEdit = canCreate && isOwn;
          return (
            <View
              key={evaluation.id}
              style={{
                marginBottom: 12,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.panel,
                padding: 16,
              }}
            >
              <View className="flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#173f4a]">
                  <Ionicons name="clipboard-outline" size={21} color={COLORS.green} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white">{evaluation.playerName}</Text>
                  <Text className="mt-1 text-xs text-[#aab7c7]">
                    {evaluation.season} · {evaluation.season_year} · {evaluation.coachName}
                  </Text>
                </View>
                <View className="items-center rounded-xl bg-[#173f4a] px-3 py-2">
                  <Text className="text-[10px] font-semibold uppercase tracking-wider text-[#aab7c7]">
                    Overall
                  </Text>
                  <Text className="mt-0.5 text-lg font-black text-[#78d4aa]">
                    {evaluation.overall_rating == null ? "—" : evaluation.overall_rating.toFixed(1)}
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {(
                  [
                    "technical_score",
                    "tactical_score",
                    "physical_score",
                    "personality_score",
                  ] as const
                ).map((key) => (
                  <View
                    key={key}
                    style={{
                      minWidth: 70,
                      borderRadius: 12,
                      backgroundColor: "#0b1c2d",
                      paddingHorizontal: 9,
                      paddingVertical: 7,
                    }}
                  >
                    <Text className="text-[9px] uppercase tracking-wider text-[#aab7c7]">
                      {key.replace("_score", "")}
                    </Text>
                    <Text className="mt-1 font-bold text-white">
                      {evaluation[key] == null ? "—" : evaluation[key]!.toFixed(1)}
                    </Text>
                  </View>
                ))}
              </View>
              {evaluation.coach_verdict && (
                <Text className="mt-3 text-sm font-bold text-[#78d4aa]">
                  Verdict: {evaluation.coach_verdict}
                </Text>
              )}
              {evaluation.development_goals && (
                <View className="mt-3 border-t border-[#1e3a52] pt-3">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-[#78d4aa]">
                    Next development step
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-[#d5dfea]">
                    {evaluation.development_goals}
                  </Text>
                </View>
              )}
              {evaluation.strengths && (
                <Text className="mt-3 text-sm leading-5 text-[#aab7c7]">
                  Strengths: {evaluation.strengths}
                </Text>
              )}
              {evaluation.weaknesses && (
                <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
                  Areas to improve: {evaluation.weaknesses}
                </Text>
              )}
              {allowEdit && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openEdit(evaluation)}
                  style={{
                    minHeight: 48,
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 13,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: "#173f4a",
                  }}
                >
                  <Ionicons name="create-outline" size={17} color={COLORS.green} />
                  <Text className="ml-2 font-bold text-[#d5f5e5]">Edit your evaluation</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={open} transparent animationType="slide" onRequestClose={closeForm}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              maxHeight: "95%",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              backgroundColor: COLORS.background,
              paddingHorizontal: 18,
              paddingTop: 16,
              paddingBottom: 26,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-black text-white">
                  {editing ? "Update evaluation" : "New evaluation"}
                </Text>
                <Text className="mt-1 text-sm text-[#aab7c7]">
                  {selectedPlayer
                    ? `${selectedPlayer.first_name} ${selectedPlayer.last_name} · ${activePeriodSeason} · ${new Date().getFullYear()}`
                    : "Rate the player's current season."}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close evaluation form"
                onPress={closeForm}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 22,
                  backgroundColor: COLORS.panel,
                }}
                hitSlop={6}
              >
                <Ionicons name="close" size={22} color={COLORS.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!editing && (
                <>
                  <TextInput
                    value={playerSearch}
                    onChangeText={setPlayerSearch}
                    placeholder="Search your players"
                    placeholderTextColor="#71839a"
                    style={{
                      minHeight: 48,
                      marginBottom: 9,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 14,
                      backgroundColor: COLORS.field,
                      paddingHorizontal: 14,
                      color: COLORS.white,
                      fontSize: 15,
                    }}
                  />
                  {playersQuery.isLoading && (
                    <ActivityIndicator color={COLORS.green} style={{ marginVertical: 10 }} />
                  )}
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {filteredPlayers.map((player) => {
                      const active = player.id === playerId;
                      return (
                        <Pressable
                          key={player.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => choosePlayer(player.id)}
                          style={{
                            minHeight: 44,
                            justifyContent: "center",
                            borderRadius: 13,
                            borderWidth: 1,
                            borderColor: active ? COLORS.green : COLORS.border,
                            backgroundColor: active ? "#173f4a" : COLORS.field,
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                          }}
                        >
                          <Text className="text-xs font-semibold text-white">
                            {player.first_name} {player.last_name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {playerId ? (
                <>
                  <View className="mb-3 flex-row flex-wrap gap-2">
                    <Score label="Technical" value={scores.technical_score} />
                    <Score label="Tactical" value={scores.tactical_score} />
                    <Score label="Physical" value={scores.physical_score} />
                    <Score label="Character" value={scores.personality_score} />
                    <Score label="Overall" value={scores.overall_rating} />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 9 }}
                  >
                    {MOBILE_SKILL_CATEGORIES.map((item) => {
                      const selected = category === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => setCategory(item.key)}
                          style={{
                            minHeight: 44,
                            justifyContent: "center",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: selected ? COLORS.green : COLORS.border,
                            backgroundColor: selected ? "#173f4a" : COLORS.field,
                            paddingHorizontal: 12,
                          }}
                        >
                          <Text className="text-xs font-bold text-white">{item.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-lg font-black text-white">
                      {MOBILE_SKILL_CATEGORIES.find((item) => item.key === category)?.label}
                    </Text>
                    <Text className="text-sm font-bold text-[#78d4aa]">
                      Average {mobileAverageScore(skills[category]).toFixed(1)}/10
                    </Text>
                  </View>
                  {MOBILE_SKILL_CATEGORIES.find((item) => item.key === category)?.skills.map(
                    (skill) => (
                      <View
                        key={skill}
                        style={{
                          minHeight: 58,
                          marginBottom: 7,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          borderRadius: 14,
                          backgroundColor: COLORS.panel,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                        }}
                      >
                        <Text className="flex-1 pr-2 text-sm font-semibold text-white">
                          {skill}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Lower ${skill} rating`}
                          onPress={() => setSkill(category, skill, skills[category][skill] - 1)}
                          disabled={skills[category][skill] <= 1}
                          style={{
                            width: 42,
                            height: 42,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 12,
                            backgroundColor: "#0b1c2d",
                            opacity: skills[category][skill] <= 1 ? 0.4 : 1,
                          }}
                        >
                          <Ionicons name="remove" size={19} color={COLORS.green} />
                        </Pressable>
                        <Text className="mx-3 w-6 text-center text-base font-black text-[#78d4aa]">
                          {skills[category][skill]}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Raise ${skill} rating`}
                          onPress={() => setSkill(category, skill, skills[category][skill] + 1)}
                          disabled={skills[category][skill] >= 10}
                          style={{
                            width: 42,
                            height: 42,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 12,
                            backgroundColor: "#173f4a",
                            opacity: skills[category][skill] >= 10 ? 0.4 : 1,
                          }}
                        >
                          <Ionicons name="add" size={19} color={COLORS.green} />
                        </Pressable>
                      </View>
                    ),
                  )}

                  <View className="mt-4">
                    <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#aab7c7]">
                      Coach verdict *
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {MOBILE_VERDICTS.map((verdict) => {
                        const selected = assessment.coach_verdict === verdict;
                        return (
                          <Pressable
                            key={verdict}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() =>
                              setAssessment((current) => ({ ...current, coach_verdict: verdict }))
                            }
                            style={{
                              minHeight: 44,
                              justifyContent: "center",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: selected ? COLORS.green : COLORS.border,
                              backgroundColor: selected ? "#173f4a" : COLORS.field,
                              paddingHorizontal: 11,
                              paddingVertical: 8,
                            }}
                          >
                            <Text className="text-xs font-semibold text-white">{verdict}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  <View className="mt-4">
                    <AssessmentField
                      label="Strengths"
                      value={assessment.strengths}
                      onChangeText={(value) =>
                        setAssessment((current) => ({ ...current, strengths: value }))
                      }
                      placeholder="What is the player doing well?"
                    />
                    <AssessmentField
                      label="Areas to improve"
                      value={assessment.weaknesses}
                      onChangeText={(value) =>
                        setAssessment((current) => ({ ...current, weaknesses: value }))
                      }
                      placeholder="Where should the player improve?"
                    />
                    <AssessmentField
                      label="Development goals"
                      value={assessment.development_goals}
                      onChangeText={(value) =>
                        setAssessment((current) => ({ ...current, development_goals: value }))
                      }
                      placeholder="Next development steps"
                    />
                    <AssessmentField
                      label="Additional notes"
                      value={assessment.coach_notes}
                      onChangeText={(value) =>
                        setAssessment((current) => ({ ...current, coach_notes: value }))
                      }
                      placeholder="Optional coach notes"
                    />
                  </View>
                  {hasOtherCurrentEvaluation && !editing && (
                    <Text
                      style={{
                        marginBottom: 12,
                        borderRadius: 14,
                        backgroundColor: "#4b2530",
                        color: COLORS.red,
                        padding: 12,
                        fontSize: 13,
                        lineHeight: 19,
                      }}
                    >
                      Another coach has already evaluated this player for the current season and
                      year.
                    </Text>
                  )}
                  {message && (
                    <Text
                      style={{
                        marginBottom: 12,
                        borderRadius: 14,
                        backgroundColor: "#4b2530",
                        color: COLORS.red,
                        padding: 12,
                        fontSize: 13,
                        lineHeight: 19,
                      }}
                    >
                      {message}
                    </Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    onPress={submit}
                    disabled={save.isPending || !canCreate}
                    style={{
                      minHeight: 54,
                      marginBottom: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 16,
                      backgroundColor: COLORS.green,
                      opacity: save.isPending || !canCreate ? 0.55 : 1,
                    }}
                  >
                    {save.isPending ? (
                      <ActivityIndicator color={COLORS.background} />
                    ) : (
                      <Text className="font-black text-[#071521]">
                        {editing ? "Save evaluation" : "Submit evaluation"}
                      </Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text className="mb-4 text-sm leading-5 text-[#aab7c7]">
                  Choose a player to load the full skill assessment form.
                </Text>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
