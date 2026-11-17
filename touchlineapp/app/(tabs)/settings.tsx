import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { supabase } from "@/lib/touchline/supabase";

const input =
  "mb-3 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-3.5 text-base text-white";

type AcademyProfile = {
  id: string;
  name: string;
  slug: string;
  report_tagline: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

async function fetchAcademyProfile(academyId: string) {
  const { data, error } = await supabase
    .from("academies")
    .select("id, name, slug, report_tagline, contact_email, contact_phone")
    .eq("id", academyId)
    .single();
  if (error) throw error;
  return data as AcademyProfile;
}

export default function SettingsScreen() {
  const { context } = useTouchlineAuth();
  const owner = context?.role === "academy_admin";
  const profileQuery = useQuery({
    queryKey: ["mobile-academy-profile", context?.academy?.id],
    queryFn: () => fetchAcademyProfile(context!.academy!.id),
    enabled: owner && Boolean(context?.academy),
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const academy = profileQuery.data;
  useEffect(() => {
    if (!academy || loadedId === academy.id) return;
    const timer = setTimeout(() => {
      setLoadedId(academy.id);
      setName(academy.name);
      setSlug(academy.slug);
      setTagline(academy.report_tagline ?? "");
      setEmail(academy.contact_email ?? "");
      setPhone(academy.contact_phone ?? "");
    }, 0);
    return () => clearTimeout(timer);
  }, [academy, loadedId]);
  if (!context) return null;
  const saveBranding = async () => {
    if (!academy) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase())) {
      setFeedback({
        tone: "error",
        text: "Use lowercase letters, numbers, and hyphens only for the workspace slug.",
      });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from("academies")
        .update({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          report_tagline: tagline.trim(),
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
        })
        .eq("id", academy.id);
      if (error) throw error;
      await profileQuery.refetch();
      setFeedback({ tone: "success", text: "Academy branding and report identity were updated." });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save academy settings.",
      });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async () => {
    if (password.length < 8) {
      setFeedback({ tone: "error", text: "Use a password with at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setFeedback({
        tone: "error",
        text: "Passwords do not match. Enter the same password twice.",
      });
      return;
    }
    setPasswordSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      setFeedback({
        tone: "success",
        text: "Password updated. Use it to sign in on both mobile and web.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };
  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Platform"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <Text className="text-2xl font-black text-white">Settings</Text>
        <Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">
          Manage the shared Touchline account and workspace settings.
        </Text>
        {feedback && (
          <Text
            style={{
              marginBottom: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: feedback.tone === "error" ? "#683344" : "#2b6e66",
              backgroundColor: feedback.tone === "error" ? "#3b2430" : "#102f38",
              color: feedback.tone === "error" ? "#ffd7de" : "#d5f5e5",
              padding: 13,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {feedback.text}
          </Text>
        )}
        {owner ? (
          <>
            <View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
              <Text className="mb-3 text-base font-black text-white">
                Academy branding and reports
              </Text>
              <Text className="mb-4 text-sm leading-5 text-[#aab7c7]">
                These details appear on player evaluation reports and the web workspace.
              </Text>
              {profileQuery.isLoading ? (
                <ActivityIndicator color="#78d4aa" />
              ) : (
                <>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Academy name"
                    placeholderTextColor="#71839a"
                    className={input}
                  />
                  <TextInput
                    value={slug}
                    onChangeText={setSlug}
                    autoCapitalize="none"
                    placeholder="Workspace slug"
                    placeholderTextColor="#71839a"
                    className={input}
                  />
                  <TextInput
                    value={tagline}
                    onChangeText={setTagline}
                    placeholder="Report tagline"
                    placeholderTextColor="#71839a"
                    className={input}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Academy email"
                    placeholderTextColor="#71839a"
                    className={input}
                  />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="Academy phone"
                    placeholderTextColor="#71839a"
                    className={input}
                  />
                  <Pressable
                    disabled={saving}
                    onPress={() => {
                      void saveBranding();
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
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    <Text className="text-center font-black text-[#071521]">
                      {saving ? "Saving…" : "Save academy settings"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
            <Pressable
              onPress={() => router.push("/billing")}
              className="mb-5 rounded-2xl border border-[#2b6e66] bg-[#102f38] p-5"
              style={{
                minHeight: 84,
                marginBottom: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#2b6e66",
                backgroundColor: "#102f38",
                padding: 18,
                justifyContent: "center",
              }}
            >
              <Text className="text-base font-black text-white">Subscription and billing</Text>
              <Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">
                Open packages, M-Pesa checkout, and your 30-day subscription period.
              </Text>
            </Pressable>
          </>
        ) : (
          <View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
            <Text className="text-base font-black text-white">Owner settings</Text>
            <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
              Academy branding, billing, and workspace controls are available only to the Academy
              Owner.
            </Text>
          </View>
        )}
        <View className="rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
          <Text className="mb-3 text-base font-black text-white">Change password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password (8+ characters)"
            placeholderTextColor="#71839a"
            secureTextEntry
            className={input}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            placeholderTextColor="#71839a"
            secureTextEntry
            className={input}
          />
          <Pressable
            disabled={passwordSaving}
            onPress={() => {
              void changePassword();
            }}
            className="rounded-2xl border border-[#2b5268] bg-[#173f4a] px-4 py-4"
            style={{
              minHeight: 54,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#2b5268",
              borderRadius: 16,
              backgroundColor: "#173f4a",
              paddingHorizontal: 16,
              paddingVertical: 14,
              opacity: passwordSaving ? 0.6 : 1,
            }}
          >
            <Text className="text-center font-black text-[#d5f5e5]">
              {passwordSaving ? "Updating…" : "Update password"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
