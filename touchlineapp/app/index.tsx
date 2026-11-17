import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type MobileRole } from "@/lib/touchline/context";
import { supabase } from "@/lib/touchline/supabase";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";

const roles: MobileRole[] = ["super_admin", "academy_admin", "academy_manager", "coach"];
const onboardingUrl = "https://touchlineelite.vercel.app/onboard";
const features = [
  [
    "people-outline",
    "Player records",
    "Keep player profiles, teams, seasons, and development history together.",
  ],
  [
    "clipboard-outline",
    "Coach evaluations",
    "Record consistent technical, tactical, physical, and personal assessments.",
  ],
  ["bar-chart-outline", "Progress tracking", "Follow each player’s next steps from any device."],
] as const;

function TouchlineMark({ size = 74 }: { size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-[24px] border-2 border-[#d6b45a] bg-white p-1"
      style={{ width: size, height: size }}
    >
      <Image
        source={require("@/assets/images/icon.png")}
        style={{ width: size - 10, height: size - 10 }}
        resizeMode="contain"
      />
    </View>
  );
}

function TouchlineSplash() {
  return (
    <ScreenContainer containerClassName="bg-[#17202f]" safeAreaClassName="bg-[#17202f]">
      <View className="flex-1 items-center justify-center px-8">
        <TouchlineMark size={188} />
        <Text className="mt-7 text-xs font-black uppercase tracking-[4px] text-[#d6b45a]">
          Touchline
        </Text>
        <Text className="mt-4 text-center text-2xl font-black text-white">
          Your academy workspace.
        </Text>
        <View className="mt-8 flex-row items-center">
          <ActivityIndicator size="small" color="#d6b45a" />
          <Text className="ml-3 text-xs font-semibold text-[#aeb8c7]">Loading…</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

export default function EntryScreen() {
  const { loading, context, error, signIn } = useTouchlineAuth();
  const [splashReady, setSplashReady] = useState(false);
  const [splashTimedOut, setSplashTimedOut] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MobileRole | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const minimumTimer = setTimeout(() => setSplashReady(true), 3500);
    const maximumTimer = setTimeout(() => setSplashTimedOut(true), 5000);
    return () => {
      clearTimeout(minimumTimer);
      clearTimeout(maximumTimer);
    };
  }, []);
  if (context) return <Redirect href="/(tabs)" />;
  if ((!splashReady || loading) && !splashTimedOut) return <TouchlineSplash />;
  const openLogin = (role: MobileRole) => {
    setSelectedRole(role);
    setMessage(null);
    setLoginOpen(true);
  };
  const submit = async () => {
    if (!selectedRole) return;
    setMessage(null);
    if (!email.trim() || !password) {
      setMessage("Enter the email and password issued for your Touchline account.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password, selectedRole);
      setLoginOpen(false);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const resetPassword = async () => {
    setMessage(null);
    if (!email.trim()) {
      setMessage("Enter your account email first, then tap Forgot password again.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: "https://touchlineelite.vercel.app/reset-password" },
    );
    setMessage(
      resetError ? resetError.message : "Check your email for a secure password reset link.",
    );
  };
  return (
    <ScreenContainer containerClassName="bg-[#17202f]" safeAreaClassName="bg-[#17202f]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <TouchlineMark size={92} />
          <Text className="mt-4 text-xs font-black uppercase tracking-[3px] text-[#d6b45a]">
            Touchline mobile
          </Text>
          <Text className="mt-3 text-center text-3xl font-black text-white">
            Your academy workspace
          </Text>
          <Text className="mt-3 max-w-sm text-center text-sm leading-6 text-[#aeb8c7]">
            Manage player development, evaluations, coaches, and academy operations from the same
            Touchline account you use on the web.
          </Text>
        </View>
        <View className="mt-7 rounded-3xl border border-[#3a4656] bg-[#202b3a] p-4">
          <Text className="mb-3 px-1 text-xs font-bold uppercase tracking-[2px] text-[#d6b45a]">
            Choose your portal
          </Text>
          <View className="gap-2">
            {roles.map((role) => (
              <Pressable
                key={role}
                onPress={() => openLogin(role)}
                style={({ pressed }) => [styles.roleButton, pressed && styles.pressed]}
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#2b3c4b]">
                  <Ionicons
                    name={
                      role === "coach"
                        ? "clipboard-outline"
                        : role === "super_admin"
                          ? "shield-checkmark-outline"
                          : role === "academy_admin"
                            ? "business-outline"
                            : "people-outline"
                    }
                    size={19}
                    color="#d6b45a"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white">{ROLE_LABELS[role]}</Text>
                  <Text className="mt-1 text-xs leading-4 text-[#aeb8c7]">
                    {ROLE_DESCRIPTIONS[role]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color="#d6b45a" />
              </Pressable>
            ))}
          </View>
        </View>
        <View className="mt-6">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-[#5cae83]">
            Built for daily academy work
          </Text>
          {features.map(([icon, title, body]) => (
            <View
              key={title}
              className="mt-3 flex-row rounded-2xl border border-[#2e3c4d] bg-[#202b3a] p-4"
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#1d3a37]">
                <Ionicons name={icon} size={20} color="#8fd4ac" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white">{title}</Text>
                <Text className="mt-1 text-sm leading-5 text-[#aeb8c7]">{body}</Text>
              </View>
            </View>
          ))}
        </View>
        <View className="mt-6 rounded-2xl border border-[#d6b45a]/50 bg-[#293342] p-4">
          <Text className="text-base font-bold text-white">New academy owner?</Text>
          <Text className="mt-1 text-sm leading-5 text-[#c5ced9]">
            Create your workspace, start the 14-day trial, and use the same credentials on the web
            and mobile app.
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(onboardingUrl)}
            className="mt-4 flex-row items-center justify-center rounded-xl bg-[#d6b45a] px-4 py-3"
            style={{
              minHeight: 50,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: "#d6b45a",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text className="font-black text-[#17202f]">Create academy workspace</Text>
            <Ionicons name="arrow-forward" size={17} color="#17202f" style={{ marginLeft: 7 }} />
          </Pressable>
        </View>
        <Text className="mt-7 text-center text-xs leading-5 text-[#71839a]">
          Fast, simple access to the Touchline workspace. No duplicate account is needed.
        </Text>
      </ScrollView>
      <Modal
        visible={loginOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLoginOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/60"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="rounded-t-[30px] border-t border-[#3f4d5e] bg-[#17202f] px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-[#d6b45a]">
                  Touchline access
                </Text>
                <Text className="mt-2 text-2xl font-black text-white">
                  {selectedRole ? ROLE_LABELS[selectedRole] : "Sign in"}
                </Text>
                <Text className="mt-1 text-sm text-[#aeb8c7]">
                  Use your existing website credentials.
                </Text>
              </View>
              <Pressable
                onPress={() => setLoginOpen(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#263443]"
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 22,
                  backgroundColor: "#263443",
                }}
                hitSlop={4}
              >
                <Ionicons name="close" size={21} color="#d5dfea" />
              </Pressable>
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#8794a5"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              className="mb-3 rounded-2xl border border-[#3f4d5e] bg-[#202b3a] px-4 py-4 text-base text-white"
            />
            <View className="mb-4 flex-row items-center rounded-2xl border border-[#3f4d5e] bg-[#202b3a]">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#8794a5"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 px-4 py-4 text-base text-white"
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                className="px-4 py-4"
                style={{
                  minWidth: 50,
                  minHeight: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color="#d5dfea"
                />
              </Pressable>
            </View>
            {(error || message) && (
              <Text className="mb-4 rounded-2xl bg-[#4b2c34] px-4 py-3 text-sm leading-5 text-[#ffd7de]">
                {message ?? error}
              </Text>
            )}
            <Pressable
              onPress={submit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.pressed,
                submitting && styles.disabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#17202f" />
              ) : (
                <Text className="text-center text-base font-black text-[#17202f]">Sign in</Text>
              )}
            </Pressable>
            <Pressable
              onPress={resetPassword}
              className="mt-4 items-center py-2"
              style={{
                minHeight: 44,
                marginTop: 12,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
              }}
            >
              <Text className="text-sm font-semibold text-[#e2c66d]">Forgot password?</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 44 },
  roleButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3f4d5e",
    backgroundColor: "#263443",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  submitButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#d6b45a",
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
});
