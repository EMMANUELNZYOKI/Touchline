import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { AcademyIdentity, MetricCard } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { loadDashboardMetrics } from "@/lib/touchline/dashboard";
import { fetchMobileEvaluations } from "@/lib/touchline/data";

export default function ReportsScreen() {
  const { context } = useTouchlineAuth();
  const metrics = useQuery({ queryKey: ["mobile-report-metrics", context?.academy?.id], queryFn: () => loadDashboardMetrics(context!.academy!.id), enabled: Boolean(context?.academy) });
  const evaluations = useQuery({ queryKey: ["mobile-report-evaluations", context?.academy?.id], queryFn: () => fetchMobileEvaluations(context!.academy!.id), enabled: Boolean(context?.academy) });
  if (!context) return null;
  const list = evaluations.data ?? [];
  const average = list.length ? list.reduce((sum, item) => sum + (item.overall_rating ?? 0), 0) / list.length : 0;
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const webUrl = (extra.touchlineWebUrl ?? "https://touchlineelite.vercel.app").replace(/\/$/, "");
  return <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]"><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}><AcademyIdentity name={context.academy?.name ?? "Touchline Academy"} role={context.role} userName={context.profile.full_name} /><Text className="text-2xl font-black text-white">Reports</Text><Text className="mb-6 mt-2 text-sm leading-5 text-[#aab7c7]">Performance summaries from the same players and evaluations used by the web reports workspace.</Text>{metrics.isLoading && <ActivityIndicator color="#78d4aa" />}<View className="mb-3 flex-row gap-3"><MetricCard label="Players" value={String(metrics.data?.players ?? 0)} icon="people-outline" /><MetricCard label="Evaluations" value={String(metrics.data?.evaluations ?? 0)} icon="clipboard-outline" accent="#8bb8ff" /></View><View className="mb-6 flex-row gap-3"><MetricCard label="Average rating" value={average ? average.toFixed(1) : "—"} icon="star-outline" accent="#f2c36b" /><MetricCard label="Coaches" value={String(metrics.data?.coaches ?? 0)} icon="person-outline" accent="#dca7ff" /></View><View className="rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5"><Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">Report workspace</Text><Text className="mt-2 text-lg font-bold text-white">{context.subscription?.plan_key === "pro" ? "Pro academy intelligence" : "Academy performance"}</Text><Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">{context.subscription?.plan_key === "pro" ? "Your Pro workspace includes the advanced team, coach, development, and export reporting surfaces. Additional report controls are synchronized with the web account." : "Use this summary to track registrations, evaluations, and development progress. Upgrade from the Owner Billing area to unlock Pro intelligence reports."}</Text><Pressable onPress={() => { void Linking.openURL(`${webUrl}/admin/reports`); }} className="mt-5 rounded-2xl bg-[#78d4aa] px-4 py-4"><Text className="text-center font-black text-[#071521]">Open full reports and exports</Text></Pressable></View></ScrollView></ScreenContainer>;
}
