import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { ActionCard, AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";

export default function MoreScreen() {
  const { context } = useTouchlineAuth();
  if (!context || context.role === "super_admin") return null;
  const isOwner = context.role === "academy_admin";
  const canManageCoaches = context.role === "academy_admin" || context.role === "academy_manager";
  const canUseAcademyReports = context.role !== "coach";
  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Academy"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <Text className="text-2xl font-black text-white">More Touchline tools</Text>
        <Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">
          Everything else from your academy workspace, connected to the same web records.
        </Text>
        {isOwner && (
          <ActionCard
            title="Managers"
            body="Create, activate, and delegate daily academy operations."
            icon="shield-checkmark-outline"
            onPress={() => router.push("/(tabs)/managers")}
          />
        )}
        {canManageCoaches && (
          <ActionCard
            title="Coaches"
            body="Manage coach accounts, assigned players, and evaluation activity."
            icon="people-outline"
            onPress={() => router.push("/coaches")}
          />
        )}
        {context.role === "coach" && (
          <ActionCard
            title="My evaluation history"
            body="Review your submitted evaluations and personal performance summary."
            icon="clipboard-outline"
            onPress={() => router.push("/history")}
          />
        )}
        {canUseAcademyReports && (
          <>
            <ActionCard
              title="Reports"
              body="Review academy performance and development summaries."
              icon="bar-chart-outline"
              onPress={() => router.push("/reports")}
            />
            <ActionCard
              title="Activity history"
              body="See recent player registrations and evaluations."
              icon="time-outline"
              onPress={() => router.push("/activity")}
            />
          </>
        )}
        <ActionCard
          title="Academy settings"
          body="View workspace identity, subscription, and operational settings."
          icon="settings-outline"
          onPress={() => router.push("/settings")}
        />
        <View className="mt-5 rounded-2xl border border-[#1e3a52] bg-[#0b1c2d] p-4">
          <Ionicons name="shield-checkmark-outline" size={22} color="#78d4aa" />
          <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
            Owner-only billing and platform controls remain protected by your Touchline role.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
