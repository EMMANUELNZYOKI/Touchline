import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/touchline/supabase";

type State = "loading" | "ready" | "saving" | "success" | "error";

function sessionFromUrl(url: string | null) {
  if (!url) return null;
  const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const query = new URLSearchParams(hash);
  const accessToken = query.get("access_token");
  const refreshToken = query.get("refresh_token");
  return accessToken && refreshToken
    ? { access_token: accessToken, refresh_token: refreshToken }
    : null;
}

export default function ResetPasswordScreen() {
  const [state, setState] = useState<State>("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const finishRecovery = async (url?: string | null) => {
      try {
        const tokens = sessionFromUrl(url ?? (await Linking.getInitialURL()));
        if (tokens) {
          const { error } = await supabase.auth.setSession(tokens);
          if (error) throw error;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setState(data.session ? "ready" : "error");
        if (!data.session) setMessage("This password reset link is missing or has expired.");
      } catch (error) {
        if (!mounted) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "The password reset link is invalid.");
      }
    };
    void finishRecovery();
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void finishRecovery(url);
    });
    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" && session) setState("ready");
    });
    return () => {
      mounted = false;
      subscription.remove();
      authSubscription.data.subscription.unsubscribe();
    };
  }, []);

  const updatePassword = async () => {
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setState("saving");
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState("ready");
      setMessage(error.message);
      return;
    }
    setPassword("");
    setConfirmation("");
    setState("success");
  };

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <View className="flex-1 justify-center px-6">
        <Text className="text-xs font-black uppercase tracking-[3px] text-[#d6b45a]">Touchline</Text>
        <Text className="mt-3 text-3xl font-black text-white">Reset your password</Text>
        {state === "loading" && (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#78d4aa" />
            <Text className="mt-3 text-sm text-[#aab7c7]">Checking your secure reset link…</Text>
          </View>
        )}
        {state === "error" && (
          <View className="mt-6 rounded-2xl border border-[#683344] bg-[#3b2430] p-4">
            <Text className="text-sm leading-5 text-[#ffd7de]">{message}</Text>
            <Pressable onPress={() => router.replace("/")} style={{ minHeight: 48, justifyContent: "center", marginTop: 8 }}>
              <Text className="font-bold text-[#d6b45a]">Back to sign in</Text>
            </Pressable>
          </View>
        )}
        {(state === "ready" || state === "saving") && (
          <View className="mt-6">
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="New password (8+ characters)" placeholderTextColor="#71839a" className="mb-3 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-4 text-base text-white" />
            <TextInput value={confirmation} onChangeText={setConfirmation} secureTextEntry placeholder="Confirm new password" placeholderTextColor="#71839a" className="mb-4 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-4 text-base text-white" />
            {message && <Text className="mb-4 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm text-[#ffd7de]">{message}</Text>}
            <Pressable disabled={state === "saving"} onPress={() => void updatePassword()} style={{ minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#78d4aa", opacity: state === "saving" ? 0.6 : 1 }}>
              {state === "saving" ? <ActivityIndicator color="#071521" /> : <Text className="font-black text-[#071521]">Update password</Text>}
            </Pressable>
          </View>
        )}
        {state === "success" && (
          <View className="mt-6 rounded-2xl border border-[#2b6e66] bg-[#102f38] p-4">
            <Text className="text-sm leading-5 text-[#d5f5e5]">Password updated. Use the new password on both the web and mobile app.</Text>
            <Pressable onPress={() => router.replace("/")} style={{ minHeight: 48, justifyContent: "center", marginTop: 8 }}>
              <Text className="font-bold text-[#78d4aa]">Continue to sign in</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
