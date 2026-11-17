import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { useState } from "react";

import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { ROLE_LABELS, type MobileRole } from "@/lib/touchline/context";

export function TouchlineMark({ size = 54 }: { size?: number }) {
  return (
    <View
      className="overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg"
      style={{ width: size, height: size }}
    >
      <Image
        source={require("@/assets/images/icon.png")}
        className="h-full w-full"
        resizeMode="contain"
      />
    </View>
  );
}

function AccountPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { context, signOut } = useTouchlineAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  if (!context) return null;
  const signOutNow = () => setConfirmSignOut(true);
  const performSignOut = async () => {
    setConfirmSignOut(false);
    onClose();
    try {
      await signOut();
    } finally {
      router.replace("/");
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 flex-row justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} style={{ flex: 1 }} />
        <View className="h-full w-[86%] max-w-[380px] border-l border-[#2b5268] bg-[#071521] px-5 pb-8 pt-14">
          <View className="mb-8 flex-row items-center justify-between">
            <Text className="text-xs font-black uppercase tracking-[3px] text-[#78d4aa]">
              Account panel
            </Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#10263a]"
              style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              hitSlop={8}
            >
              <Ionicons name="close" size={21} color="#d5f5e5" />
            </Pressable>
          </View>
          <View className="items-center rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
            <TouchlineMark size={76} />
            <Text className="mt-4 text-center text-xl font-black text-white">
              {context.profile.full_name}
            </Text>
            <Text className="mt-1 text-center text-sm text-[#aab7c7]">{context.profile.email}</Text>
            <View className="mt-4 rounded-full bg-[#173f4a] px-4 py-2">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">
                {ROLE_LABELS[context.role]}
              </Text>
            </View>
          </View>
          <View className="mt-5 rounded-2xl border border-[#1e3a52] bg-[#0b1c2d] p-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-[#78d4aa]">
              Signed into
            </Text>
            <Text className="mt-2 text-lg font-bold text-white">
              {context.academy?.name ?? "Touchline Platform"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-[#aab7c7]">
              Your mobile and web workspace use the same account and data.
            </Text>
          </View>
          <Pressable
            onPress={signOutNow}
            className="mt-6 flex-row items-center justify-center rounded-2xl border border-[#683344] bg-[#3b2430] px-4 py-4 active:opacity-80"
            style={{
              minHeight: 54,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#683344",
              borderRadius: 16,
              backgroundColor: "#3b2430",
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#ffd7de" />
            <Text className="ml-2 font-black text-[#ffd7de]">Log out</Text>
          </Pressable>
          <Text className="mt-6 text-center text-xs leading-5 text-[#71839a]">
            To sign in as another Touchline user, log out first, then choose the correct role.
          </Text>
        </View>
        {confirmSignOut && (
          <View
            className="absolute inset-0 items-center justify-center bg-black/70 px-6"
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View className="w-full max-w-[340px] rounded-3xl border border-[#2b5268] bg-[#10263a] p-5">
              <Text className="text-xl font-black text-white">Sign out?</Text>
              <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
                You can sign in again with any Touchline role from the welcome screen.
              </Text>
              <View className="mt-5 flex-row gap-3">
                <Pressable
                  onPress={() => setConfirmSignOut(false)}
                  className="flex-1 rounded-xl border border-[#2b5268] bg-[#173f4a] px-4 py-3"
                  style={{
                    flex: 1,
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#2b5268",
                    borderRadius: 12,
                    backgroundColor: "#173f4a",
                    paddingHorizontal: 16,
                  }}
                >
                  <Text className="font-bold text-[#d5f5e5]">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={performSignOut}
                  className="flex-1 rounded-xl bg-[#c65b70] px-4 py-3"
                  style={{
                    flex: 1,
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: "#c65b70",
                    paddingHorizontal: 16,
                  }}
                >
                  <Text className="font-black text-white">Sign out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export function AcademyIdentity({
  name,
  role,
  userName,
}: {
  name: string;
  role: MobileRole;
  userName: string;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <>
      <View className="mb-6 flex-row items-center gap-3">
        <TouchlineMark />
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[2px] text-[#78d4aa]">
            {ROLE_LABELS[role]}
          </Text>
          <Text className="mt-1 text-xl font-bold text-white" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-1 text-sm text-[#aab7c7]" numberOfLines={1}>
            Welcome, {userName}
          </Text>
        </View>
        <Pressable
          onPress={() => setPanelOpen(true)}
          className="h-12 w-12 items-center justify-center rounded-2xl border border-[#2b5268] bg-[#17304a] active:opacity-70"
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#2b5268",
            borderRadius: 16,
            backgroundColor: "#17304a",
          }}
          hitSlop={4}
        >
          <Ionicons name="person-outline" size={21} color="#d5f5e5" />
        </Pressable>
      </View>
      <AccountPanel visible={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  accent = "#78d4aa",
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: string;
}) {
  return (
    <View className="min-h-[108px] flex-1 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wider text-[#aab7c7]">
          {label}
        </Text>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text className="text-3xl font-bold text-white">{value}</Text>
    </View>
  );
}

export function ActionCard({
  title,
  body,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4 active:opacity-80"
      style={{
        minHeight: 84,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#1e3a52",
        borderRadius: 16,
        backgroundColor: "#10263a",
        padding: 16,
      }}
    >
      <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-[#173f4a]">
        <Ionicons name={icon} size={21} color="#78d4aa" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-white">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-[#aab7c7]">{body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#78d4aa" />
    </Pressable>
  );
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-[360px] rounded-3xl border border-[#2b5268] bg-[#10263a] p-5">
          <Text className="text-xl font-black text-white">{title}</Text>
          <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">{message}</Text>
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-xl border border-[#2b5268] bg-[#173f4a] px-4 py-3"
              style={{ flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center" }}
            >
              <Text className="font-bold text-[#d5f5e5]">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 rounded-xl px-4 py-3 ${danger ? "bg-[#c65b70]" : "bg-[#78d4aa]"}`}
              style={{ flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center" }}
            >
              <Text className={`font-black ${danger ? "text-white" : "text-[#071521]"}`}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
