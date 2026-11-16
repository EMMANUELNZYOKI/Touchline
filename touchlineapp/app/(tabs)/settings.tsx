import { ScrollView, Text, View } from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";

export default function SettingsScreen() {
  const { context } = useTouchlineAuth();
  if (!context) return null;
  const subscription = context.subscription;
  return <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}><AcademyIdentity name={context.academy?.name ?? "Touchline Platform"} role={context.role} userName={context.profile.full_name} /><Text className="text-2xl font-black text-white">Settings</Text><Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">Workspace identity and access settings from the shared Touchline account.</Text><View className="mb-4 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5"><Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">Workspace</Text><Text className="mt-2 text-xl font-bold text-white">{context.academy?.name ?? "Touchline Platform"}</Text><Text className="mt-2 text-sm text-[#aab7c7]">Role: {context.role === "academy_admin" ? "Academy Owner" : context.role === "academy_manager" ? "Academy Manager" : context.role === "super_admin" ? "Super Admin" : "Coach"}</Text></View>{context.role === "academy_admin" && <View className="mb-4 rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5"><Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">Subscription</Text><Text className="mt-2 text-xl font-bold capitalize text-white">{subscription?.status?.replace("_", " ") ?? "Not available"}</Text><Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">Plan: {(subscription?.plan_key ?? "trial").toUpperCase()}. Billing and M-Pesa package changes are available from the Billing tab.</Text></View>}<View className="rounded-3xl border border-[#1e3a52] bg-[#0b1c2d] p-5"><Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">Support</Text><Text className="mt-2 text-sm leading-5 text-[#aab7c7]">For account, package, or academy workspace support, contact the Touchline platform administrator. Your mobile and web app use the same secure account and records.</Text></View></ScrollView></ScreenContainer>;
}
