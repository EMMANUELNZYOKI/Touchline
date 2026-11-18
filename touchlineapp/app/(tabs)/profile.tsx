import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, TouchableOpacity, ScrollView, Text, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";

export default function ProfileScreen() {
  const { context, signOut } = useTouchlineAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!context) return null;

  const subscriptionLabel =
    context.subscription?.status === "trialing"
      ? "14-day trial"
      : (context.subscription?.status?.replace("_", " ") ?? "Not available");

  const performSignOut = async () => {
    setConfirmSignOut(false);
    await signOut();
    router.replace("/");
  };

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Platform"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <Text className="text-2xl font-black text-white">Profile</Text>
        <View className="mt-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-[#78d4aa]">
            Signed in account
          </Text>
          <Text className="mt-3 text-lg font-bold text-white">{context.profile.full_name}</Text>
          <Text className="mt-1 text-sm text-[#aab7c7]">{context.profile.email}</Text>
          <View className="my-5 h-px bg-[#1e3a52]" />
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-[#aab7c7]">Role</Text>
            <Text className="font-semibold text-white">
              {context.role.replace("academy_", "Academy ")}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-[#aab7c7]">Academy</Text>
            <Text className="max-w-[60%] text-right font-semibold text-white">
              {context.academy?.name ?? "Platform"}
            </Text>
          </View>
          {context.role === "academy_admin" && (
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-sm text-[#aab7c7]">Subscription</Text>
              <Text className="font-semibold capitalize text-[#78d4aa]">{subscriptionLabel}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setConfirmSignOut(true)}
          className="mt-5 flex-row items-center justify-center rounded-2xl border border-[#683344] bg-[#3b2430] px-4 py-4 active:opacity-80"
          style={{ minHeight: 56, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="log-out-outline" size={19} color="#ffd7de" />
          <Text className="ml-2 font-bold text-[#ffd7de]">Sign out</Text>
        </TouchableOpacity>
        <Text className="mt-8 text-center text-xs text-[#71839a]">
          Powered by Touchline • Shared securely with your web workspace
        </Text>
      </ScrollView>
      <Modal
        visible={confirmSignOut}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmSignOut(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-[340px] rounded-3xl border border-[#2b5268] bg-[#10263a] p-5">
            <Text className="text-xl font-black text-white">Sign out?</Text>
            <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
              You can sign in again with any Touchline role from the welcome screen.
            </Text>
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConfirmSignOut(false)}
                className="flex-1 rounded-xl border border-[#2b5268] bg-[#173f4a] px-4 py-3"
                style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center" }}
              >
                <Text className="font-bold text-[#d5f5e5]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={performSignOut}
                className="flex-1 rounded-xl bg-[#c65b70] px-4 py-3"
                style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center" }}
              >
                <Text className="font-black text-white">Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
