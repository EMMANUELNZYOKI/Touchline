import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { supabase } from "@/lib/touchline/supabase";

const input = "mb-3 rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-3.5 text-base text-white";

type AcademyProfile = { id: string; name: string; slug: string; report_tagline: string | null; contact_email: string | null; contact_phone: string | null };

async function fetchAcademyProfile(academyId: string) {
  const { data, error } = await supabase.from("academies").select("id, name, slug, report_tagline, contact_email, contact_phone").eq("id", academyId).single();
  if (error) throw error;
  return data as AcademyProfile;
}

export default function SettingsScreen() {
  const { context } = useTouchlineAuth();
  const owner = context?.role === "academy_admin";
  const profileQuery = useQuery({ queryKey: ["mobile-academy-profile", context?.academy?.id], queryFn: () => fetchAcademyProfile(context!.academy!.id), enabled: owner && Boolean(context?.academy) });
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
  const academy = profileQuery.data;
  useEffect(() => {
    if (!academy || loadedId === academy.id) return;
    const timer = setTimeout(() => {
      setLoadedId(academy.id); setName(academy.name); setSlug(academy.slug); setTagline(academy.report_tagline ?? ""); setEmail(academy.contact_email ?? ""); setPhone(academy.contact_phone ?? "");
    }, 0);
    return () => clearTimeout(timer);
  }, [academy, loadedId]);
  if (!context) return null;
  const saveBranding = async () => {
    if (!academy) return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase())) { Alert.alert("Invalid slug", "Use lowercase letters, numbers, and hyphens only."); return; }
    setSaving(true);
    const { error } = await supabase.from("academies").update({ name: name.trim(), slug: slug.trim().toLowerCase(), report_tagline: tagline.trim(), contact_email: email.trim() || null, contact_phone: phone.trim() || null }).eq("id", academy.id);
    setSaving(false);
    if (error) { Alert.alert("Could not save settings", error.message); return; }
    await profileQuery.refetch();
    Alert.alert("Saved", "Academy branding and report identity were updated.");
  };
  const changePassword = async () => {
    if (password.length < 8) { Alert.alert("Password too short", "Use at least 8 characters."); return; }
    if (password !== confirm) { Alert.alert("Passwords do not match", "Enter the same password twice."); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordSaving(false);
    if (error) { Alert.alert("Could not change password", error.message); return; }
    setPassword(""); setConfirm(""); Alert.alert("Password updated", "Use the new password on both mobile and web.");
  };
  return <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><AcademyIdentity name={context.academy?.name ?? "Touchline Platform"} role={context.role} userName={context.profile.full_name} /><Text className="text-2xl font-black text-white">Settings</Text><Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">Manage the shared Touchline account and workspace settings.</Text>{owner ? <><View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5"><Text className="mb-3 text-base font-black text-white">Academy branding and reports</Text><Text className="mb-4 text-sm leading-5 text-[#aab7c7]">These details appear on player evaluation reports and the web workspace.</Text>{profileQuery.isLoading ? <ActivityIndicator color="#78d4aa" /> : <><TextInput value={name} onChangeText={setName} placeholder="Academy name" placeholderTextColor="#71839a" className={input} /><TextInput value={slug} onChangeText={setSlug} autoCapitalize="none" placeholder="Workspace slug" placeholderTextColor="#71839a" className={input} /><TextInput value={tagline} onChangeText={setTagline} placeholder="Report tagline" placeholderTextColor="#71839a" className={input} /><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Academy email" placeholderTextColor="#71839a" className={input} /><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Academy phone" placeholderTextColor="#71839a" className={input} /><Pressable disabled={saving} onPress={() => { void saveBranding(); }} className="rounded-2xl bg-[#78d4aa] px-4 py-4"><Text className="text-center font-black text-[#071521]">{saving ? "Saving…" : "Save academy settings"}</Text></Pressable></>}</View><Pressable onPress={() => router.push("/billing")} className="mb-5 rounded-2xl border border-[#2b6e66] bg-[#102f38] p-5"><Text className="text-base font-black text-white">Subscription and billing</Text><Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">Open packages, M-Pesa checkout, and your 30-day subscription period.</Text></Pressable></> : <View className="mb-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5"><Text className="text-base font-black text-white">Owner settings</Text><Text className="mt-2 text-sm leading-5 text-[#aab7c7]">Academy branding, billing, and workspace controls are available only to the Academy Owner.</Text></View>}<View className="rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5"><Text className="mb-3 text-base font-black text-white">Change password</Text><TextInput value={password} onChangeText={setPassword} placeholder="New password (8+ characters)" placeholderTextColor="#71839a" secureTextEntry className={input} /><TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" placeholderTextColor="#71839a" secureTextEntry className={input} /><Pressable disabled={passwordSaving} onPress={() => { void changePassword(); }} className="rounded-2xl border border-[#2b5268] bg-[#173f4a] px-4 py-4"><Text className="text-center font-black text-[#d5f5e5]">{passwordSaving ? "Updating…" : "Update password"}</Text></Pressable></View></ScrollView></ScreenContainer>;
}
