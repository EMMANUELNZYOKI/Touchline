import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  createMobilePlayer,
  fetchMobilePlayers,
  updateMobilePlayer,
  type MobilePlayer,
  type MobilePlayerInput,
} from "@/lib/touchline/data";
import { MOBILE_GENDERS, MOBILE_POSITIONS, MOBILE_PREFERRED_FEET } from "@/lib/touchline/skills";

const COLORS = {
  background: "#071521",
  panel: "#10263a",
  field: "#0b1c2d",
  border: "#2b4862",
  green: "#78d4aa",
  muted: "#aab7c7",
  white: "#ffffff",
  danger: "#ffd7de",
};

const emptyPlayer = (): MobilePlayerInput => ({
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
});

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#aab7c7]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#71839a"
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        style={{
          minHeight: multiline ? 96 : 50,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          backgroundColor: COLORS.field,
          color: COLORS.white,
          paddingHorizontal: 15,
          paddingVertical: 13,
          fontSize: 15,
        }}
      />
    </View>
  );
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#aab7c7]">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : option)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                borderWidth: 1,
                borderColor: selected ? COLORS.green : COLORS.border,
                borderRadius: 13,
                backgroundColor: selected ? "#173f4a" : COLORS.field,
                paddingHorizontal: 13,
                paddingVertical: 9,
              }}
            >
              <Text className="text-sm font-semibold text-white">{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function PlayersScreen() {
  const { context } = useTouchlineAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [player, setPlayer] = useState<MobilePlayerInput>(emptyPlayer);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const playersQuery = useQuery({
    queryKey: ["mobile-players", context?.academy?.id, context?.profile.id],
    queryFn: () =>
      fetchMobilePlayers(context!.academy!.id, {
        coachId: context!.role === "coach" ? context!.profile.id : undefined,
      }),
    enabled: Boolean(context?.academy),
  });

  const closeForm = () => {
    setFormOpen(false);
    setEditingPlayerId(null);
    setPlayer(emptyPlayer());
    setFormMessage(null);
  };

  const onSaved = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mobile-players"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["mobile-activity"] }),
    ]);
    closeForm();
  };

  const createMutation = useMutation({
    mutationFn: () => createMobilePlayer({ academyId: context!.academy!.id, player }),
    onSuccess: onSaved,
    onError: (error) =>
      setFormMessage(error instanceof Error ? error.message : "Player could not be created."),
  });
  const updateMutation = useMutation({
    mutationFn: () =>
      updateMobilePlayer({
        academyId: context!.academy!.id,
        playerId: editingPlayerId!,
        player,
      }),
    onSuccess: onSaved,
    onError: (error) =>
      setFormMessage(error instanceof Error ? error.message : "Player could not be updated."),
  });

  if (!context) return null;
  const isOwner = context.role === "academy_admin";
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const subscriptionWritable =
    context.subscription?.status === "active" || context.subscription?.status === "trialing";
  const canWrite = context.academy?.status === "active" && subscriptionWritable;

  const openCreate = () => {
    setEditingPlayerId(null);
    setPlayer(emptyPlayer());
    setFormMessage(null);
    setFormOpen(true);
  };
  const openEdit = (selected: MobilePlayer) => {
    setEditingPlayerId(selected.id);
    const { coachName: _coachName, hasEvaluation: _hasEvaluation, ...fields } = selected;
    setPlayer(fields);
    setFormMessage(null);
    setFormOpen(true);
  };
  const setText = (key: keyof MobilePlayerInput, value: string) => {
    const numericKeys: (keyof MobilePlayerInput)[] = ["jersey_number", "height", "weight"];
    setPlayer((previous) => ({
      ...previous,
      [key]: numericKeys.includes(key) ? toOptionalNumber(value) : value || null,
    }));
  };
  const submit = () => {
    if (!player.first_name.trim() || !player.last_name.trim()) {
      setFormMessage("First name and last name are required.");
      return;
    }
    setFormMessage(null);
    if (editingPlayerId) updateMutation.mutate();
    else createMutation.mutate();
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
            <Text className="text-2xl font-black text-white">Players</Text>
            <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
              Shared player records, profile information, and development status.
            </Text>
          </View>
          {isOwner && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add player"
              onPress={openCreate}
              disabled={!canWrite}
              style={{
                width: 52,
                height: 52,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 17,
                backgroundColor: canWrite ? COLORS.green : "#53616b",
                opacity: canWrite ? 1 : 0.55,
              }}
              hitSlop={6}
            >
              <Ionicons name="add" size={26} color={COLORS.background} />
            </Pressable>
          )}
        </View>

        {!isOwner && context.role === "academy_manager" && (
          <View
            style={{
              marginBottom: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.panel,
              padding: 13,
            }}
          >
            <Text className="text-sm leading-5 text-[#aab7c7]">
              Player write actions are owner-only under the current academy database policy. You can
              review player records here.
            </Text>
          </View>
        )}
        {isOwner && !canWrite && (
          <View
            style={{
              marginBottom: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.panel,
              padding: 13,
            }}
          >
            <Text className="text-sm leading-5 text-[#aab7c7]">
              Player records are read-only while this academy is suspended or its subscription is
              not active.
            </Text>
          </View>
        )}

        {playersQuery.isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text className="mt-3 text-sm text-[#aab7c7]">Loading player records…</Text>
          </View>
        )}
        {playersQuery.error && (
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#683344",
              backgroundColor: "#3b2430",
              padding: 16,
            }}
          >
            <Text className="text-sm leading-5 text-[#ffd7de]">
              {playersQuery.error instanceof Error
                ? playersQuery.error.message
                : "Players could not be loaded. Pull down to retry."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void playersQuery.refetch()}
              style={{ minHeight: 44, justifyContent: "center", marginTop: 8 }}
            >
              <Text className="font-bold text-[#78d4aa]">Retry</Text>
            </Pressable>
          </View>
        )}
        {!playersQuery.isLoading && !playersQuery.error && playersQuery.data?.length === 0 && (
          <View className="items-center rounded-3xl border border-dashed border-[#2b4862] bg-[#10263a] px-5 py-12">
            <Ionicons name="people-outline" size={34} color={COLORS.green} />
            <Text className="mt-4 text-lg font-bold text-white">No players yet</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-[#aab7c7]">
              {isOwner
                ? "Tap + to add the first player to this academy."
                : "Your academy team will appear here once players are added."}
            </Text>
          </View>
        )}
        {playersQuery.data?.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole={isOwner ? "button" : undefined}
            accessibilityLabel={isOwner ? `Edit ${item.first_name} ${item.last_name}` : undefined}
            onPress={isOwner ? () => openEdit(item) : undefined}
            style={{
              marginBottom: 12,
              borderRadius: 17,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.panel,
              padding: 16,
              minHeight: 82,
            }}
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#173f4a]">
                <Text className="text-base font-black text-[#78d4aa]">
                  {(item.first_name[0] ?? "?").toUpperCase()}
                  {(item.last_name[0] ?? "?").toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white">
                  {item.first_name} {item.last_name}
                </Text>
                <Text className="mt-1 text-xs text-[#aab7c7]">
                  {item.position || "Position not set"} · {item.team_category || "Team not set"}
                </Text>
                <Text className="mt-1 text-xs text-[#aab7c7]">
                  {item.date_of_birth ? `DOB ${item.date_of_birth}` : "Date of birth not set"}
                  {item.jersey_number == null ? "" : ` · #${item.jersey_number}`}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-semibold text-[#aab7c7]">
                  {item.season || "No season"}
                </Text>
                <Ionicons
                  name={item.hasEvaluation ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={item.hasEvaluation ? COLORS.green : "#71839a"}
                />
                {isOwner && <Text className="mt-1 text-[10px] text-[#78d4aa]">Tap to edit</Text>}
              </View>
            </View>
            <View className="mt-3 flex-row items-center border-t border-[#1e3a52] pt-3">
              <Ionicons name="person-outline" size={14} color="#71839a" />
              <Text className="ml-2 text-xs text-[#aab7c7]">Coach: {item.coachName}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={closeForm}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.68)" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              maxHeight: "94%",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.background,
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 28,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-black text-white">
                  {editingPlayerId ? "Edit player" : "Add player"}
                </Text>
                <Text className="mt-1 text-sm text-[#aab7c7]">
                  The same profile fields are available on the web.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close player form"
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
                <Ionicons name="close" size={21} color={COLORS.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-[#78d4aa]">
                Personal information
              </Text>
              <Field
                label="First name *"
                value={player.first_name}
                onChangeText={(value) => setText("first_name", value)}
              />
              <Field
                label="Last name *"
                value={player.last_name}
                onChangeText={(value) => setText("last_name", value)}
              />
              <Field
                label="Date of birth"
                value={player.date_of_birth ?? ""}
                onChangeText={(value) => setText("date_of_birth", value)}
                placeholder="YYYY-MM-DD"
              />
              <ChoiceField
                label="Gender"
                value={player.gender}
                options={MOBILE_GENDERS}
                onChange={(value) => setPlayer((current) => ({ ...current, gender: value }))}
              />
              <Field
                label="Player phone"
                value={player.phone ?? ""}
                onChangeText={(value) => setText("phone", value)}
                keyboardType="phone-pad"
              />
              <Field
                label="Parent / guardian name"
                value={player.parent_name ?? ""}
                onChangeText={(value) => setText("parent_name", value)}
              />
              <Field
                label="Parent / guardian phone"
                value={player.parent_phone ?? ""}
                onChangeText={(value) => setText("parent_phone", value)}
                keyboardType="phone-pad"
              />
              <Field
                label="Emergency contact"
                value={player.emergency_contact ?? ""}
                onChangeText={(value) => setText("emergency_contact", value)}
                keyboardType="phone-pad"
              />

              <Text className="mb-3 mt-3 text-xs font-bold uppercase tracking-wider text-[#78d4aa]">
                Football and medical information
              </Text>
              <ChoiceField
                label="Primary position"
                value={player.position}
                options={MOBILE_POSITIONS}
                onChange={(value) => setPlayer((current) => ({ ...current, position: value }))}
              />
              <ChoiceField
                label="Secondary position"
                value={player.secondary_position}
                options={MOBILE_POSITIONS}
                onChange={(value) =>
                  setPlayer((current) => ({ ...current, secondary_position: value }))
                }
              />
              <ChoiceField
                label="Preferred foot"
                value={player.preferred_foot}
                options={MOBILE_PREFERRED_FEET}
                onChange={(value) =>
                  setPlayer((current) => ({ ...current, preferred_foot: value }))
                }
              />
              <Field
                label="Season"
                value={player.season ?? ""}
                onChangeText={(value) => setText("season", value)}
                maxLength={80}
                placeholder="e.g. January to May"
              />
              <Field
                label="Category / team"
                value={player.team_category ?? ""}
                onChangeText={(value) => setText("team_category", value)}
                maxLength={80}
                placeholder="e.g. Under 11"
              />
              <Field
                label="Jersey number"
                value={player.jersey_number == null ? "" : String(player.jersey_number)}
                onChangeText={(value) => setText("jersey_number", value)}
                keyboardType="numeric"
              />
              <Field
                label="Height (cm)"
                value={player.height == null ? "" : String(player.height)}
                onChangeText={(value) => setText("height", value)}
                keyboardType="numeric"
              />
              <Field
                label="Weight (kg)"
                value={player.weight == null ? "" : String(player.weight)}
                onChangeText={(value) => setText("weight", value)}
                keyboardType="numeric"
              />
              <Field
                label="Medical notes"
                value={player.medical_notes ?? ""}
                onChangeText={(value) => setText("medical_notes", value)}
                maxLength={1000}
                multiline
                placeholder="Allergies, injuries, or relevant conditions"
              />

              {formMessage && (
                <Text
                  style={{
                    marginBottom: 12,
                    borderRadius: 16,
                    backgroundColor: "#4b2530",
                    color: COLORS.danger,
                    padding: 13,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {formMessage}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={submit}
                disabled={isSaving || !canWrite}
                style={{
                  minHeight: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  backgroundColor: COLORS.green,
                  opacity: isSaving || !canWrite ? 0.55 : 1,
                  marginBottom: 8,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text className="font-black text-[#071521]">
                    {editingPlayerId ? "Save player information" : "Create player"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
