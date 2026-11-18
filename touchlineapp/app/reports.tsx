import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { AcademyIdentity, MetricCard } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { loadDashboardMetrics } from "@/lib/touchline/dashboard";
import {
  fetchMobileEvaluations,
  fetchMobileSeasons,
  type MobileEvaluation,
} from "@/lib/touchline/data";

const COLORS = {
  background: "#071521",
  panel: "#10263a",
  field: "#0b1c2d",
  border: "#2b4862",
  green: "#78d4aa",
  blue: "#8bb8ff",
  gold: "#f2c36b",
  purple: "#dca7ff",
  white: "#ffffff",
  muted: "#aab7c7",
  danger: "#ffd7de",
};

type Period = { key: string; season: string; year: number; startsOn?: string };
type ReportEvaluation = MobileEvaluation & {
  position?: string | null;
  teamCategory?: string | null;
};

function average(values: (number | null | undefined)[]) {
  const numbers = values.filter((value): value is number => typeof value === "number");
  if (!numbers.length) return 0;
  return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function csvValue(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function shareLocalFile(uri: string, mimeType: string, title: string) {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert(
      "Export ready",
      "Your device does not provide a sharing sheet for saving this file.",
    );
    return;
  }
  const shareUri = Platform.OS === "android" ? await FileSystem.getContentUriAsync(uri) : uri;
  await Sharing.shareAsync(shareUri, { mimeType, dialogTitle: title });
}

function ActionButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="mb-2 rounded-2xl px-4 py-3"
      style={{ backgroundColor: COLORS.green, opacity: disabled ? 0.45 : 1 }}
    >
      <Text className="text-center text-sm font-black" style={{ color: COLORS.background }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ReportsScreen() {
  const { context } = useTouchlineAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedComparison, setSelectedComparison] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const reportsEnabled = context?.entitlements?.features.includes("reports") ?? false;
  const advancedAnalyticsEnabled =
    context?.entitlements?.features.includes("advanced_analytics") ?? false;
  const advancedExportsEnabled =
    context?.entitlements?.features.includes("advanced_exports") ?? false;
  const coachInsightsEnabled =
    context?.entitlements?.features.includes("coach_activity_insights") ?? false;
  const metrics = useQuery({
    queryKey: ["mobile-report-metrics", context?.academy?.id],
    queryFn: () => loadDashboardMetrics(context!.academy!.id),
    enabled: Boolean(context?.academy && reportsEnabled),
  });
  const evaluations = useQuery({
    queryKey: ["mobile-report-evaluations", context?.academy?.id],
    queryFn: () => fetchMobileEvaluations(context!.academy!.id),
    enabled: Boolean(context?.academy && reportsEnabled),
  });
  const seasons = useQuery({
    queryKey: ["mobile-report-seasons", context?.academy?.id],
    queryFn: () => fetchMobileSeasons(context!.academy!.id),
    enabled: Boolean(context?.academy && reportsEnabled),
  });

  const reportRows = useMemo(
    () => (evaluations.data ?? []) as ReportEvaluation[],
    [evaluations.data],
  );
  const periods = useMemo<Period[]>(() => {
    const seasonMap = new Map((seasons.data ?? []).map((season) => [season.id, season]));
    const map = new Map<string, Period>();
    for (const evaluation of reportRows) {
      const season = seasonMap.get(evaluation.season_id);
      const key = evaluation.season_id || `${evaluation.season_year}-${evaluation.season}`;
      map.set(key, {
        key,
        season: season?.name ?? evaluation.season,
        year: evaluation.season_year,
        startsOn: season?.starts_on,
      });
    }
    return [...map.values()].sort(
      (a, b) => (b.startsOn ?? "").localeCompare(a.startsOn ?? "") || b.year - a.year,
    );
  }, [reportRows, seasons.data]);
  const primaryKey = periods.some((period) => period.key === selectedPeriod)
    ? selectedPeriod
    : (periods[0]?.key ?? "");
  const comparisonKey =
    periods.find((period) => period.key === selectedComparison && period.key !== primaryKey)?.key ??
    periods.find((period) => period.key !== primaryKey)?.key ??
    "";
  const primaryPeriod = periods.find((period) => period.key === primaryKey);
  const selectedEvaluations = reportRows.filter(
    (evaluation) =>
      (evaluation.season_id || `${evaluation.season_year}-${evaluation.season}`) === primaryKey,
  );
  const comparisonEvaluations = reportRows.filter(
    (evaluation) =>
      (evaluation.season_id || `${evaluation.season_year}-${evaluation.season}`) === comparisonKey,
  );

  if (!context) return null;
  if (!reportsEnabled) {
    return (
      <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
          <AcademyIdentity
            name={context.academy?.name ?? "Touchline Academy"}
            role={context.role}
            userName={context.profile.full_name}
          />
          <Text className="text-2xl font-black text-white">Reports unavailable</Text>
          <Text className="mt-2 rounded-2xl border border-[#2b4862] bg-[#10263a] p-4 text-sm leading-5 text-[#aab7c7]">
            Reports are not included in this academy package. The Academy Owner can review package
            access and subscription options in Billing.
          </Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const exportCsv = async (allAcademy: boolean) => {
    const source = allAcademy ? reportRows : selectedEvaluations;
    if (!source.length) return setMessage("There are no evaluations to export for this selection.");
    try {
      const header = allAcademy
        ? [
            "Season",
            "Year",
            "Player",
            "Team/category",
            "Position",
            "Evaluating coach",
            "Overall",
            "Evaluated on",
          ]
        : [
            "Season",
            "Year",
            "Player ID",
            "Player",
            "Position",
            "Evaluating coach",
            "Technical",
            "Tactical",
            "Physical",
            "Character",
            "Overall",
            "Verdict",
            "Strengths",
            "Areas to improve",
            "Development goals",
            "Coach notes",
            "Evaluated on",
          ];
      const rows = source.map((evaluation) =>
        allAcademy
          ? [
              evaluation.season,
              evaluation.season_year,
              evaluation.playerName,
              evaluation.teamCategory,
              evaluation.position,
              evaluation.coachName,
              evaluation.overall_rating,
              new Date(evaluation.created_at).toISOString().slice(0, 10),
            ]
          : [
              evaluation.season,
              evaluation.season_year,
              evaluation.player_id,
              evaluation.playerName,
              evaluation.position,
              evaluation.coachName,
              evaluation.technical_score,
              evaluation.tactical_score,
              evaluation.physical_score,
              evaluation.personality_score,
              evaluation.overall_rating,
              evaluation.coach_verdict,
              evaluation.strengths,
              evaluation.weaknesses,
              evaluation.development_goals,
              evaluation.coach_notes,
              new Date(evaluation.created_at).toISOString().slice(0, 10),
            ],
      );
      const csv = [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\r\n");
      if (!FileSystem.cacheDirectory)
        throw new Error("This device does not provide a writable export directory.");
      const uri = `${FileSystem.cacheDirectory}touchline-${allAcademy ? "academy-analytics" : "season-report"}-${exportToken()}.csv`;
      await FileSystem.writeAsStringAsync(uri, `\uFEFF${csv}`, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await shareLocalFile(
        uri,
        "text/csv",
        allAcademy ? "Export academy analytics" : "Download season report",
      );
      setMessage("CSV export is ready to save or share.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The CSV export could not be prepared.");
    }
  };

  const exportPdf = async () => {
    if (!selectedEvaluations.length || !primaryPeriod)
      return setMessage("There are no evaluations to export for this season.");
    try {
      const rows = selectedEvaluations
        .map(
          (evaluation) =>
            `<tr><td>${escapeHtml(evaluation.playerName)}</td><td>${escapeHtml(evaluation.position)}</td><td>${escapeHtml(evaluation.coachName)}</td><td>${evaluation.overall_rating == null ? "—" : Number(evaluation.overall_rating).toFixed(1)}</td><td>${escapeHtml(evaluation.coach_verdict)}</td></tr>`,
        )
        .join("");
      const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /><style>body{font-family:Arial,sans-serif;color:#17202f;padding:28px}h1{color:#173f4a;margin-bottom:4px}.meta{color:#5c6b7a;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border-bottom:1px solid #d9e0e5;padding:8px;text-align:left}th{color:#173f4a}td:last-child{text-align:right}</style></head><body><h1>${escapeHtml(context.academy?.name ?? "Touchline")} academy report</h1><div class="meta">${escapeHtml(primaryPeriod.season)} · ${selectedEvaluations.length} evaluations · Average rating ${average(selectedEvaluations.map((item) => item.overall_rating)).toFixed(1)}/10</div><table><thead><tr><th>Player</th><th>Position</th><th>Coach</th><th>Overall</th><th>Verdict</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (!FileSystem.cacheDirectory)
        throw new Error("This device does not provide a writable export directory.");
      const cachedUri = `${FileSystem.cacheDirectory}touchline-${exportToken()}.pdf`;
      await FileSystem.copyAsync({ from: file.uri, to: cachedUri });
      await shareLocalFile(
        cachedUri,
        "application/pdf",
        `Download ${primaryPeriod.season} PDF report`,
      );
      setMessage("PDF report is ready to save or share.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The PDF report could not be prepared.");
    }
  };

  const radar = [
    ["Technical", average(selectedEvaluations.map((item) => item.technical_score))],
    ["Tactical", average(selectedEvaluations.map((item) => item.tactical_score))],
    ["Physical", average(selectedEvaluations.map((item) => item.physical_score))],
    ["Mindset", average(selectedEvaluations.map((item) => item.personality_score))],
  ];
  const byPosition = Object.entries(
    selectedEvaluations.reduce<Record<string, number[]>>((acc, item) => {
      const key = item.position || "Unassigned";
      (acc[key] ??= []).push(item.overall_rating ?? 0);
      return acc;
    }, {}),
  )
    .map(([name, values]) => ({ name, rating: average(values) }))
    .sort((a, b) => b.rating - a.rating);
  const byTeam = Object.entries(
    selectedEvaluations.reduce<Record<string, number[]>>((acc, item) => {
      const key = item.teamCategory || "Unassigned";
      (acc[key] ??= []).push(item.overall_rating ?? 0);
      return acc;
    }, {}),
  )
    .map(([name, values]) => ({ name, rating: average(values), count: values.length }))
    .sort((a, b) => b.rating - a.rating);
  const coachActivity = Object.entries(
    selectedEvaluations.reduce<Record<string, { evaluations: number; players: Set<string> }>>(
      (acc, item) => {
        const current = acc[item.coachName] ?? { evaluations: 0, players: new Set<string>() };
        current.evaluations += 1;
        current.players.add(item.player_id);
        acc[item.coachName] = current;
        return acc;
      },
      {},
    ),
  )
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.evaluations - a.evaluations);
  const topPlayers = [...selectedEvaluations]
    .sort((a, b) => (b.overall_rating ?? 0) - (a.overall_rating ?? 0))
    .slice(0, 10);
  const priorByPlayer = new Map(comparisonEvaluations.map((item) => [item.player_id, item]));
  const improvements = selectedEvaluations
    .map((current) => ({ current, prior: priorByPlayer.get(current.player_id) }))
    .filter((item): item is { current: ReportEvaluation; prior: ReportEvaluation } =>
      Boolean(item.prior),
    )
    .sort(
      (a, b) =>
        (b.current.overall_rating ?? -1) -
        (b.prior.overall_rating ?? -1) -
        ((a.current.overall_rating ?? -1) - (a.prior.overall_rating ?? -1)),
    );

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Touchline Academy"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <Text className="text-2xl font-black text-white">Reports & analytics</Text>
        <Text className="mb-5 mt-2 text-sm leading-5 text-[#aab7c7]">
          {selectedEvaluations.length} player evaluations ·{" "}
          {primaryPeriod?.season ?? "Select a season"}
        </Text>
        {metrics.isLoading || evaluations.isLoading || seasons.isLoading ? (
          <ActivityIndicator color={COLORS.green} />
        ) : null}
        {(metrics.error || evaluations.error || seasons.error) && (
          <Text className="mb-3 text-sm leading-5 text-[#ffd7de]">
            {(metrics.error ?? evaluations.error ?? seasons.error) instanceof Error
              ? (metrics.error ?? evaluations.error ?? seasons.error)?.message
              : "Report data could not be loaded."}
          </Text>
        )}
        <View className="mb-3 flex-row gap-3">
          <MetricCard
            label="Players"
            value={String(metrics.data?.players ?? 0)}
            icon="people-outline"
          />
          <MetricCard
            label="Evaluations"
            value={String(metrics.data?.evaluations ?? 0)}
            icon="clipboard-outline"
            accent={COLORS.blue}
          />
        </View>
        <View className="mb-5 flex-row gap-3">
          <MetricCard
            label="Average rating"
            value={
              selectedEvaluations.length
                ? average(selectedEvaluations.map((item) => item.overall_rating)).toFixed(1)
                : "—"
            }
            icon="star-outline"
            accent={COLORS.gold}
          />
          <MetricCard
            label="Coaches"
            value={String(metrics.data?.coaches ?? 0)}
            icon="person-outline"
            accent={COLORS.purple}
          />
        </View>
        <View className="mb-5 rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">
            {context.subscription?.plan_key === "pro"
              ? "Pro academy intelligence"
              : "Academy performance"}
          </Text>
          <Text className="mt-2 text-lg font-bold text-white">
            Advanced reports are now available in the app
          </Text>
          <Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">
            Select a season, compare development, review team and coach insights, and export CSV or
            PDF files without leaving mobile.
          </Text>
          <Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[#aab7c7]">
            Report season
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {periods.map((period) => (
                <Pressable
                  key={period.key}
                  onPress={() => setSelectedPeriod(period.key)}
                  className="rounded-xl px-3 py-2"
                  style={{
                    backgroundColor: primaryKey === period.key ? COLORS.green : COLORS.field,
                  }}
                >
                  <Text
                    className="text-xs font-black"
                    style={{ color: primaryKey === period.key ? COLORS.background : COLORS.muted }}
                  >
                    {period.season}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {periods.length > 1 && (
            <>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#aab7c7]">
                Compare against
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setSelectedComparison("")}
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: !selectedComparison ? COLORS.gold : COLORS.field }}
                  >
                    <Text
                      className="text-xs font-black"
                      style={{ color: !selectedComparison ? COLORS.background : COLORS.muted }}
                    >
                      None
                    </Text>
                  </Pressable>
                  {periods
                    .filter((period) => period.key !== primaryKey)
                    .map((period) => (
                      <Pressable
                        key={period.key}
                        onPress={() => setSelectedComparison(period.key)}
                        className="rounded-xl px-3 py-2"
                        style={{
                          backgroundColor:
                            comparisonKey === period.key ? COLORS.gold : COLORS.field,
                        }}
                      >
                        <Text
                          className="text-xs font-black"
                          style={{
                            color: comparisonKey === period.key ? COLORS.background : COLORS.muted,
                          }}
                        >
                          {period.season}
                        </Text>
                      </Pressable>
                    ))}
                </View>
              </ScrollView>
            </>
          )}
          <ActionButton
            label="Download season CSV"
            onPress={() => void exportCsv(false)}
            disabled={!selectedEvaluations.length}
          />
          <ActionButton
            label="Download season PDF"
            onPress={() => void exportPdf()}
            disabled={!selectedEvaluations.length}
          />
          {advancedExportsEnabled && (
            <ActionButton
              label="Export academy analytics CSV"
              onPress={() => void exportCsv(true)}
              disabled={!reportRows.length}
            />
          )}
          {message && <Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">{message}</Text>}
        </View>
        {!selectedEvaluations.length ? (
          <Text className="rounded-2xl border border-dashed border-[#2b4862] p-5 text-sm text-[#aab7c7]">
            No evaluations for this season.
          </Text>
        ) : (
          <>
            <View className="mb-5 rounded-3xl border border-[#2b4862] bg-[#10263a] p-5">
              <Text className="mb-3 text-base font-black text-white">
                {primaryPeriod?.season} skill profile
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {radar.map(([label, value]) => (
                  <View
                    key={String(label)}
                    className="min-w-[45%] flex-1 rounded-2xl bg-[#0b1c2d] p-3"
                  >
                    <Text className="text-xs uppercase text-[#aab7c7]">{String(label)}</Text>
                    <Text className="mt-1 text-xl font-black text-[#78d4aa]">
                      {Number(value).toFixed(1)}/10
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {comparisonKey && advancedAnalyticsEnabled && (
              <View className="mb-5 rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5">
                <Text className="mb-3 text-base font-black text-white">Player improvement</Text>
                {improvements.length ? (
                  improvements.map(({ current, prior }) => {
                    const delta =
                      current.overall_rating != null && prior.overall_rating != null
                        ? Math.round((current.overall_rating - prior.overall_rating) * 10) / 10
                        : null;
                    return (
                      <View
                        key={current.player_id}
                        className="mb-3 flex-row items-center justify-between border-b border-[#2b6e66] pb-3"
                      >
                        <View className="flex-1">
                          <Text className="font-bold text-white">{current.playerName}</Text>
                          <Text className="text-xs text-[#aab7c7]">
                            Previous {prior.overall_rating?.toFixed(1) ?? "—"} · Current{" "}
                            {current.overall_rating?.toFixed(1) ?? "—"}
                          </Text>
                        </View>
                        <Text className="font-black text-[#78d4aa]">
                          {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text className="text-sm text-[#aab7c7]">
                    No players have evaluations in both selected seasons yet.
                  </Text>
                )}
              </View>
            )}
            <View className="mb-5 rounded-3xl border border-[#2b4862] bg-[#10263a] p-5">
              <Text className="mb-3 text-base font-black text-white">Top rated players</Text>
              {topPlayers.map((item, index) => (
                <View
                  key={item.id}
                  className="mb-3 flex-row items-center justify-between border-b border-[#1e3a52] pb-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="w-5 font-black text-[#aab7c7]">{index + 1}</Text>
                    <View>
                      <Text className="font-bold text-white">{item.playerName}</Text>
                      <Text className="text-xs text-[#aab7c7]">
                        {item.position || "Unassigned"} · {item.coachName}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-black text-[#78d4aa]">
                    {item.overall_rating?.toFixed(1) ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
            {advancedAnalyticsEnabled && (
              <View className="mb-5 rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5">
                <Text className="mb-3 text-base font-black text-white">
                  Team and category comparison
                </Text>
                {byTeam.map((item) => (
                  <View key={item.name} className="mb-3 flex-row items-center justify-between">
                    <View>
                      <Text className="font-bold text-white">{item.name}</Text>
                      <Text className="text-xs text-[#aab7c7]">
                        {item.count} evaluation{item.count === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Text className="font-black text-[#78d4aa]">{item.rating.toFixed(1)}/10</Text>
                  </View>
                ))}
              </View>
            )}
            <View className="mb-5 rounded-3xl border border-[#2b4862] bg-[#10263a] p-5">
              <Text className="mb-3 text-base font-black text-white">
                Average rating by position
              </Text>
              {byPosition.map((item) => (
                <View key={item.name} className="mb-3 flex-row items-center justify-between">
                  <Text className="font-bold text-white">{item.name}</Text>
                  <Text className="font-black text-[#f2c36b]">{item.rating.toFixed(1)}/10</Text>
                </View>
              ))}
            </View>
            {advancedAnalyticsEnabled && coachInsightsEnabled && (
              <View className="mb-5 rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5">
                <Text className="mb-3 text-base font-black text-white">
                  Coach activity insights
                </Text>
                {coachActivity.map((item) => (
                  <View key={item.name} className="mb-3 flex-row items-center justify-between">
                    <View>
                      <Text className="font-bold text-white">{item.name}</Text>
                      <Text className="text-xs text-[#aab7c7]">
                        {item.players.size} players covered
                      </Text>
                    </View>
                    <Text className="font-black text-[#d5f5e5]">
                      {item.evaluations} evaluations
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
