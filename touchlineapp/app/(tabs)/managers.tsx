import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AcademyIdentity, ConfirmModal } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import {
  createMobileManager,
  fetchMobileManagers,
  setMobileManagerActive,
} from "@/lib/touchline/admin";

const input =
  "mb-3 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-3.5 text-base text-white";

export default function ManagersScreen() {
  const { context } = useTouchlineAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingManager, setPendingManager] = useState<{
    id: string;
    full_name: string;
    status: "active" | "suspended";
  } | null>(null);
  const query = useQuery({
    queryKey: ["mobile-managers", context?.academy?.id],
    queryFn: fetchMobileManagers,
    enabled: context?.role === "academy_admin",
  });
  const create = useMutation({
    mutationFn: () =>
      createMobileManager({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["mobile-managers"] });
      setOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Manager could not be created."),
  });
  const toggle = useMutation({
    mutationFn: (manager: { id: string; status: "active" | "suspended" }) =>
      setMobileManagerActive(manager.id, manager.status !== "active"),
    onSuccess: () => {
      setPendingManager(null);
      void client.invalidateQueries({ queryKey: ["mobile-managers"] });
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Manager access could not be updated."),
  });
  if (!context || context.role !== "academy_admin") return null;
  const managers = query.data?.managers ?? [];
  const canCreate = context.entitlements?.canWrite ?? false;
  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Academy"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <View className="mb-5 flex-row items-end justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-2xl font-black text-white">Managers</Text>
            <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
              Delegate daily academy operations without sharing owner billing controls.
            </Text>
          </View>
          {canCreate && <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add manager"
            onPress={() => {
              setMessage(null);
              setOpen(true);
            }}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-[#78d4aa]"
            style={{
              width: 52,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 17,
              backgroundColor: "#78d4aa",
            }}
          >
            <Ionicons name="add" size={26} color="#071521" />
          </Pressable>}
        </View>
        {message && (
          <Text className="mb-4 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm text-[#ffd7de]">
            {message}
          </Text>
        )}
        {query.isLoading && <ActivityIndicator color="#78d4aa" />}
        {query.error && (
          <Text className="mb-4 text-sm text-[#ffd7de]">
            {query.error instanceof Error
              ? query.error.message
              : "Managers could not be loaded. Retry the screen."}
          </Text>
        )}
        {managers.map((manager) => (
          <View
            key={manager.id}
            className="mb-3 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#173f4a]">
                <Text className="font-black text-[#78d4aa]">{manager.full_name.slice(0, 1)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white">{manager.full_name}</Text>
                <Text className="mt-1 text-xs text-[#aab7c7]">{manager.email}</Text>
              </View>
              <Text
                className="text-xs font-bold capitalize"
                style={{ color: manager.status === "active" ? "#78d4aa" : "#f2c36b" }}
              >
                {manager.status}
              </Text>
            </View>
            <Pressable
              onPress={() => setPendingManager(manager)}
              className="mt-4 rounded-xl border border-[#2b5268] bg-[#173f4a] px-4 py-3"
              style={{
                minHeight: 48,
                marginTop: 12,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#2b5268",
                borderRadius: 12,
                backgroundColor: "#173f4a",
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text className="text-center text-xs font-bold text-[#d5f5e5]">
                {manager.status === "active" ? "Deactivate access" : "Activate access"}
              </Text>
            </Pressable>
          </View>
        ))}
        {!query.isLoading && managers.length === 0 && (
          <Text className="py-10 text-center text-sm text-[#aab7c7]">
            No managers yet. Add one to delegate academy operations.
          </Text>
        )}
      </ScrollView>
      <ConfirmModal
        visible={Boolean(pendingManager)}
        title={`${pendingManager?.status === "active" ? "Deactivate" : "Activate"} manager?`}
        message={pendingManager?.full_name ?? ""}
        confirmLabel={pendingManager?.status === "active" ? "Deactivate" : "Activate"}
        danger={pendingManager?.status === "active"}
        onCancel={() => setPendingManager(null)}
        onConfirm={() => {
          if (pendingManager) toggle.mutate(pendingManager);
        }}
      />
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/70">
          <View className="rounded-t-3xl bg-[#071521] p-5 pb-8">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-white">Add manager</Text>
              <Pressable
                onPress={() => setOpen(false)}
                style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                hitSlop={4}
              >
                <Ionicons name="close" size={24} color="#aab7c7" />
              </Pressable>
            </View>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#71839a"
              className={input}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#71839a"
              className={input}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor="#71839a"
              className={input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Temporary password (8+ characters)"
              placeholderTextColor="#71839a"
              className={input}
              secureTextEntry
            />
            {message && (
              <Text className="mb-3 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm leading-5 text-[#ffd7de]">
                {message}
              </Text>
            )}
            <Pressable
              disabled={create.isPending}
              onPress={() => {
                if (fullName.trim().length < 2 || !email.trim() || password.length < 8) {
                  setMessage("Enter a name, email, and password of at least 8 characters.");
                  return;
                }
                create.mutate();
              }}
              className="rounded-2xl bg-[#78d4aa] px-4 py-4"
              style={{
                minHeight: 54,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                backgroundColor: "#78d4aa",
                paddingHorizontal: 16,
                paddingVertical: 14,
                opacity: create.isPending ? 0.6 : 1,
              }}
            >
              <Text className="text-center font-black text-[#071521]">
                {create.isPending ? "Creating…" : "Create manager"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
