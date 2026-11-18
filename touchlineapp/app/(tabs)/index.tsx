import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { ActionCard, AcademyIdentity, MetricCard } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { ROLE_LABELS } from "@/lib/touchline/context";
import {
  loadCoachDashboardData,
  loadDashboardMetrics,
  type CoachDashboardData,
  type DashboardMetrics,
} from "@/lib/touchline/dashboard";
import {
  changePlatformAcademyPackage,
  createPlatformAcademy,
  deletePlatformAcademy,
  fetchPlatformAcademies,
  type PlatformAcademy,
  updatePlatformAcademy,
} from "@/lib/touchline/platform";

function displayDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusColor(status: string) {
  if (status === "active") return "#78d4aa";
  if (status === "past_due" || status === "suspended") return "#f2c36b";
  return "#aab7c7";
}

function ControlButton({
  label,
  icon,
  onPress,
  disabled = false,
  danger = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      className={`mr-2 mt-2 flex-row items-center rounded-xl border px-3 py-2 ${danger ? "border-[#7d3b49] bg-[#4b2530]" : "border-[#2b5268] bg-[#173f4a]"} ${disabled ? "opacity-50" : "active:opacity-70"}`}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons name={icon} size={14} color={danger ? "#ffd7de" : "#78d4aa"} />
      <Text className={`ml-1 text-xs font-bold ${danger ? "text-[#ffd7de]" : "text-[#d5f5e5]"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PlatformAcademyCard({
  academy,
  expanded,
  busy,
  onManage,
  onToggle,
  onPackage,
  onDelete,
}: {
  academy: PlatformAcademy;
  expanded: boolean;
  busy: boolean;
  onManage: () => void;
  onToggle: () => void;
  onPackage: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4">
      <View className="flex-row items-start">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#173f4a]">
          <Ionicons name="business-outline" size={21} color="#78d4aa" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">{academy.academy_name}</Text>
          <Text className="mt-1 text-xs text-[#aab7c7]">/{academy.slug}</Text>
        </View>
        <View className="items-end">
          <Text
            className="text-xs font-bold capitalize"
            style={{ color: statusColor(academy.academy_status) }}
          >
            {academy.academy_status}
          </Text>
          <Text className="mt-1 text-xs font-semibold uppercase text-[#78d4aa]">
            {academy.plan_key}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row flex-wrap border-t border-[#1e3a52] pt-3">
        <View className="w-1/2 pb-3">
          <Text className="text-[10px] uppercase tracking-wider text-[#71839a]">Subscription</Text>
          <Text className="mt-1 text-sm font-semibold capitalize text-white">
            {academy.subscription_status.replace("_", " ")}
          </Text>
        </View>
        <View className="w-1/2 pb-3">
          <Text className="text-[10px] uppercase tracking-wider text-[#71839a]">
            Period / trial end
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white">
            {displayDate(
              academy.subscription_status === "trialing"
                ? academy.trial_ends_at
                : academy.current_period_end,
            )}
          </Text>
        </View>
        <View className="w-1/2">
          <Text className="text-[10px] uppercase tracking-wider text-[#71839a]">
            Players / evaluations
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white">
            {academy.player_count} / {academy.evaluation_count}
          </Text>
        </View>
        <View className="w-1/2">
          <Text className="text-[10px] uppercase tracking-wider text-[#71839a]">
            Coaches / managers
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white">
            {academy.coach_count} / {academy.manager_count}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center border-t border-[#1e3a52] pt-2">
        <TouchableOpacity
          onPress={onManage}
          className="flex-1 flex-row items-center py-2 active:opacity-70"
          style={{
            flex: 1,
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
          }}
          hitSlop={6}
        >
          <Ionicons name={expanded ? "chevron-up" : "settings-outline"} size={16} color="#78d4aa" />
          <Text className="ml-2 text-sm font-bold text-[#d5f5e5]">
            {expanded ? "Close manage" : "Manage academy"}
          </Text>
        </TouchableOpacity>
        {busy && <Text className="text-xs text-[#aab7c7]">Saving…</Text>}
      </View>
      {expanded && (
        <View className="flex-row flex-wrap border-t border-[#1e3a52] pt-1">
          <ControlButton
            label={academy.academy_status === "active" ? "Deactivate" : "Activate"}
            icon={
              academy.academy_status === "active" ? "pause-circle-outline" : "play-circle-outline"
            }
            onPress={onToggle}
            disabled={busy}
          />
          <ControlButton
            label="Change package"
            icon="card-outline"
            onPress={onPackage}
            disabled={busy}
          />
          <ControlButton
            label="Delete"
            icon="trash-outline"
            onPress={onDelete}
            disabled={busy}
            danger
          />
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#aab7c7]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71839a"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        className="rounded-xl border border-[#2b5268] bg-[#0b1c2d] px-3 py-3 text-sm text-white"
      />
    </View>
  );
}

function PlatformModal({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/70">
        <View className="max-h-[92%] rounded-t-3xl border-t border-[#2b5268] bg-[#10263a] px-5 pb-8 pt-5">
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-xl font-black text-white">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-[#173f4a]"
              style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#d5f5e5" />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

function SuperAdminDashboard({
  userName,
  refresh,
}: {
  userName: string;
  refresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [managedAcademyId, setManagedAcademyId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [packageAcademy, setPackageAcademy] = useState<PlatformAcademy | null>(null);
  const [packageKey, setPackageKey] = useState<"starter" | "standard" | "pro">("starter");
  const [packageReason, setPackageReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [academyName, setAcademyName] = useState("");
  const [academySlug, setAcademySlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const query = useQuery({
    queryKey: ["platform-academies"],
    queryFn: fetchPlatformAcademies,
    retry: 1,
  });
  const academies = query.data ?? [];
  const activeSubscriptions = academies.filter(
    (academy) => academy.subscription_status === "active",
  ).length;
  const activeAcademies = academies.filter((academy) => academy.academy_status === "active").length;
  const totalPlayers = academies.reduce(
    (sum, academy) => sum + Number(academy.player_count || 0),
    0,
  );
  const totalCoaches = academies.reduce(
    (sum, academy) => sum + Number(academy.coach_count || 0),
    0,
  );
  const totalManagers = academies.reduce(
    (sum, academy) => sum + Number(academy.manager_count || 0),
    0,
  );
  const totalEvaluations = academies.reduce(
    (sum, academy) => sum + Number(academy.evaluation_count || 0),
    0,
  );

  const reload = async () => {
    await query.refetch();
  };
  const runAction = async (academyId: string, action: () => Promise<unknown>) => {
    setBusyId(academyId);
    setActionError(null);
    setActionMessage(null);
    try {
      await action();
      await reload();
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The platform action could not be completed.",
      );
      return false;
    } finally {
      setBusyId(null);
    }
  };
  const toggleAcademy = (academy: PlatformAcademy) => {
    const nextStatus = academy.academy_status === "active" ? "suspended" : "active";
    const action = nextStatus === "suspended" ? "Deactivate" : "Activate";
    setConfirmAction({
      title: `${action} academy?`,
      message: `${academy.academy_name} will be ${nextStatus === "suspended" ? "unavailable to academy users" : "available again"}.`,
      confirmLabel: action,
      onConfirm: () => {
        setConfirmAction(null);
        void runAction(academy.academy_id, () =>
          updatePlatformAcademy({
            academyId: academy.academy_id,
            academyStatus: nextStatus,
            subscriptionStatus: academy.subscription_status,
          }),
        );
      },
    });
  };
  const deleteAcademy = (academy: PlatformAcademy) => {
    setConfirmAction({
      title: "Delete academy permanently?",
      message: `This removes ${academy.academy_name}, its players, evaluations, subscriptions, and academy user accounts.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        setConfirmAction(null);
        void runAction(academy.academy_id, () => deletePlatformAcademy(academy.academy_id));
      },
    });
  };
  const openPackage = (academy: PlatformAcademy) => {
    setPackageAcademy(academy);
    setPackageKey(
      academy.plan_key === "standard" || academy.plan_key === "pro" ? academy.plan_key : "starter",
    );
    setPackageReason("");
    setActionError(null);
  };
  const submitPackage = async () => {
    if (!packageAcademy) return;
    if (packageReason.trim().length < 3) {
      setActionError("Add a short reason for the package change.");
      return;
    }
    const completed = await runAction(packageAcademy.academy_id, () =>
      changePlatformAcademyPackage({
        academyId: packageAcademy.academy_id,
        planKey: packageKey,
        reason: packageReason.trim(),
      }),
    );
    if (completed) {
      setPackageAcademy(null);
      setActionMessage(`${packageAcademy.academy_name} is now on the ${packageKey} package.`);
    }
  };
  const submitCreate = async () => {
    if (!academyName.trim() || !academySlug.trim() || !adminName.trim() || !adminEmail.trim()) {
      setActionError("Complete the academy name, slug, owner name, and owner email.");
      return;
    }
    setCreating(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await createPlatformAcademy({
        name: academyName.trim(),
        slug: academySlug.trim().toLowerCase(),
        adminFullName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPhone: adminPhone.trim(),
      });
      setCreateOpen(false);
      setAcademyName("");
      setAcademySlug("");
      setAdminName("");
      setAdminEmail("");
      setAdminPhone("");
      await reload();
      setActionMessage(
        `Academy created. Credentials for ${result.administrator.fullName}: ${result.administrator.email} / ${result.administrator.temporaryPassword}`,
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The academy could not be created.");
    } finally {
      setCreating(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), reload()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenContainer
      containerClassName="bg-[#071521]"
      safeAreaClassName="bg-[#071521]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#78d4aa"
            colors={["#78d4aa"]}
          />
        }
      >
        <AcademyIdentity name="Touchline Platform" role="super_admin" userName={userName} />
        <View className="mb-5 rounded-3xl border border-[#2b6e66] bg-[#102f38] p-5">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-[#78d4aa]">
            Platform control center
          </Text>
          <Text className="mt-2 text-2xl font-black text-white">Academies at a glance</Text>
          <Text className="mt-2 text-sm leading-5 text-[#d5f5e5]">
            Manage the same academies, subscriptions, and workspaces available on the Touchline web
            dashboard.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setActionError(null);
            setCreateOpen(true);
          }}
          className="mb-5 flex-row items-center justify-center rounded-2xl bg-[#78d4aa] px-4 py-4 active:opacity-80"
          style={{
            minHeight: 58,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#071521" />
          <Text className="ml-2 text-sm font-black text-[#071521]">Add academy</Text>
        </TouchableOpacity>
        {actionError && (
          <View className="mb-4 rounded-2xl border border-[#7d3b49] bg-[#4b2530] px-4 py-3">
            <Text className="text-sm leading-5 text-[#ffd7de]">{actionError}</Text>
          </View>
        )}
        {actionMessage && (
          <View className="mb-4 rounded-2xl border border-[#2b6e66] bg-[#102f38] px-4 py-3">
            <Text className="text-sm leading-5 text-[#d5f5e5]">{actionMessage}</Text>
          </View>
        )}
        {query.isLoading && (
          <Text className="mb-4 text-sm text-[#aab7c7]">Loading platform records…</Text>
        )}
        {query.error && (
          <Text className="mb-4 rounded-2xl bg-[#4b2530] px-4 py-3 text-sm leading-5 text-[#ffd7de]">
            {query.error instanceof Error
              ? query.error.message
              : "The platform dashboard could not be loaded."}
          </Text>
        )}
        <View className="mb-3 flex-row gap-3">
          <MetricCard
            label="Academies"
            value={query.isLoading ? "—" : String(academies.length)}
            icon="business-outline"
          />
          <MetricCard
            label="Active workspaces"
            value={query.isLoading ? "—" : String(activeAcademies)}
            icon="radio"
            accent="#8bb8ff"
          />
        </View>
        <View className="mb-3 flex-row gap-3">
          <MetricCard
            label="Subscriptions"
            value={query.isLoading ? "—" : String(activeSubscriptions)}
            icon="card-outline"
            accent="#f2c36b"
          />
          <MetricCard
            label="Players managed"
            value={query.isLoading ? "—" : String(totalPlayers)}
            icon="people-outline"
            accent="#dca7ff"
          />
        </View>
        <View className="mb-6 flex-row gap-3">
          <MetricCard
            label="Coaches managed"
            value={query.isLoading ? "—" : String(totalCoaches)}
            icon="person-outline"
          />
          <MetricCard
            label="Managers managed"
            value={query.isLoading ? "—" : String(totalManagers)}
            icon="shield-checkmark-outline"
            accent="#f2c36b"
          />
        </View>
        <View className="mb-6 rounded-2xl border border-[#1e3a52] bg-[#0b1c2d] p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-[#78d4aa]">
              Evaluation activity
            </Text>
            <Ionicons name="clipboard-outline" size={18} color="#78d4aa" />
          </View>
          <Text className="mt-2 text-2xl font-black text-white">{totalEvaluations}</Text>
          <Text className="mt-1 text-sm text-[#aab7c7]">
            Evaluations logged across all academy workspaces.
          </Text>
        </View>
        <Text className="mb-3 text-base font-bold text-white">Academy accounts</Text>
        {academies.map((academy) => (
          <PlatformAcademyCard
            key={academy.academy_id}
            academy={academy}
            expanded={managedAcademyId === academy.academy_id}
            busy={busyId === academy.academy_id}
            onManage={() =>
              setManagedAcademyId((current) =>
                current === academy.academy_id ? null : academy.academy_id,
              )
            }
            onToggle={() => toggleAcademy(academy)}
            onPackage={() => openPackage(academy)}
            onDelete={() => deleteAcademy(academy)}
          />
        ))}
      </ScrollView>
      <Modal
        visible={Boolean(confirmAction)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmAction(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-[360px] rounded-3xl border border-[#2b5268] bg-[#10263a] p-5">
            <Text className="text-xl font-black text-white">{confirmAction?.title}</Text>
            <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">{confirmAction?.message}</Text>
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-[#2b5268] bg-[#173f4a] px-4 py-3"
                style={{ flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center" }}
              >
                <Text className="font-bold text-[#d5f5e5]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmAction?.onConfirm()}
                className={`flex-1 rounded-xl px-4 py-3 ${confirmAction?.danger ? "bg-[#c65b70]" : "bg-[#78d4aa]"}`}
                style={{ flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center" }}
              >
                <Text
                  className={`font-black ${confirmAction?.danger ? "text-white" : "text-[#071521]"}`}
                >
                  {confirmAction?.confirmLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <PlatformModal
        visible={Boolean(packageAcademy)}
        title={`Change package${packageAcademy ? ` — ${packageAcademy.academy_name}` : ""}`}
        onClose={() => setPackageAcademy(null)}
      >
        <Text className="mb-3 text-sm leading-5 text-[#aab7c7]">
          The new package will update the shared web and mobile subscription record.
        </Text>
        <View className="mb-3 flex-row gap-2">
          {(["starter", "standard", "pro"] as const).map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => setPackageKey(key)}
              className={`flex-1 rounded-xl border px-2 py-3 ${packageKey === key ? "border-[#78d4aa] bg-[#173f4a]" : "border-[#2b5268] bg-[#0b1c2d]"}`}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
                paddingVertical: 12,
              }}
            >
              <Text className="text-center text-xs font-bold uppercase text-white">{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field
          label="Reason"
          value={packageReason}
          onChangeText={setPackageReason}
          placeholder="Customer upgrade request"
        />
        {actionError && (
          <Text className="mb-3 rounded-xl bg-[#4b2530] px-3 py-2 text-sm text-[#ffd7de]">
            {actionError}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => {
            void submitPackage();
          }}
          className="rounded-xl bg-[#78d4aa] px-4 py-4"
          style={{
            minHeight: 54,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text className="text-center text-sm font-black text-[#071521]">Save package change</Text>
        </TouchableOpacity>
      </PlatformModal>
      <PlatformModal visible={createOpen} title="Add academy" onClose={() => setCreateOpen(false)}>
        <Text className="mb-3 text-sm leading-5 text-[#aab7c7]">
          Creates the workspace and its Academy Owner account with the standard Touchline trial
          setup.
        </Text>
        <Field
          label="Academy name"
          value={academyName}
          onChangeText={(value) => {
            setAcademyName(value);
            if (!academySlug)
              setAcademySlug(
                value
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
          }}
          placeholder="Rising Stars Academy"
        />
        <Field
          label="Workspace slug"
          value={academySlug}
          onChangeText={setAcademySlug}
          placeholder="rising-stars"
        />
        <Field
          label="Owner full name"
          value={adminName}
          onChangeText={setAdminName}
          placeholder="Academy Owner"
        />
        <Field
          label="Owner email"
          value={adminEmail}
          onChangeText={setAdminEmail}
          placeholder="owner@academy.co.ke"
          keyboardType="email-address"
        />
        <Field
          label="Owner phone"
          value={adminPhone}
          onChangeText={setAdminPhone}
          placeholder="0712345678"
          keyboardType="phone-pad"
        />
        {actionError && (
          <Text className="mb-3 rounded-xl bg-[#4b2530] px-3 py-2 text-sm text-[#ffd7de]">
            {actionError}
          </Text>
        )}
        <TouchableOpacity
          disabled={creating}
          onPress={() => {
            void submitCreate();
          }}
          className="rounded-xl bg-[#78d4aa] px-4 py-4"
          style={{
            minHeight: 54,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 16,
            opacity: creating ? 0.6 : 1,
          }}
        >
          <Text className="text-center text-sm font-black text-[#071521]">
            {creating ? "Creating…" : "Create academy"}
          </Text>
        </TouchableOpacity>
      </PlatformModal>
    </ScreenContainer>
  );
}

function CoachDashboard({
  academyName,
  userName,
  data,
  loading,
  refreshing,
  onRefresh,
}: {
  academyName: string;
  userName: string;
  data?: CoachDashboardData;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) {
  return (
    <ScreenContainer
      containerClassName="bg-[#071521]"
      safeAreaClassName="bg-[#071521]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#78d4aa"
            colors={["#78d4aa"]}
          />
        }
      >
        <AcademyIdentity name={academyName} role="coach" userName={userName} />
        <Text className="mb-1 text-2xl font-black text-white">Your coaching workspace</Text>
        <Text className="mb-5 text-sm leading-5 text-[#aab7c7]">
          Track your registered players and their development evaluations.
        </Text>
        <View className="mb-3 flex-row gap-3">
          <MetricCard
            label="Registered players"
            value={loading ? "—" : String(data?.registeredPlayers ?? 0)}
            icon="people-outline"
          />
          <MetricCard
            label="Awaiting evaluation"
            value={loading ? "—" : String(data?.awaitingEvaluation ?? 0)}
            icon="time-outline"
            accent="#f2c36b"
          />
        </View>
        <View className="mb-3 flex-row gap-3">
          <MetricCard
            label="Players evaluated"
            value={loading ? "—" : String(data?.playersEvaluated ?? 0)}
            icon="checkmark-circle-outline"
            accent="#8bb8ff"
          />
          <MetricCard
            label="Average rating"
            value={
              loading ? "—" : data?.averageRating ? `${data.averageRating.toFixed(1)}/10` : "—"
            }
            icon="star-outline"
            accent="#dca7ff"
          />
        </View>
        <View className="mb-6 flex-row gap-3">
          <MetricCard
            label="Added this month"
            value={loading ? "—" : String(data?.addedThisMonth ?? 0)}
            icon="calendar-outline"
          />
          <View className="flex-1" />
        </View>
        <Text className="mb-3 text-base font-bold text-white">Recently registered</Text>
        {!loading && !data?.recentPlayers.length && (
          <Text className="mb-5 rounded-2xl border border-dashed border-[#2b4862] p-5 text-sm text-[#aab7c7]">
            No players have been registered yet.
          </Text>
        )}
        {data?.recentPlayers.map((player) => (
          <Pressable
            key={player.id}
            onPress={() => router.push({ pathname: "/player/[id]", params: { id: player.id } })}
            className="mb-3 flex-row items-center rounded-2xl border border-[#1e3a52] bg-[#10263a] p-4"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#173f4a]">
              <Text className="font-black text-[#78d4aa]">
                {player.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-white">{player.name}</Text>
              <Text className="mt-1 text-xs text-[#aab7c7]">
                Added {new Date(player.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className={`text-xs font-bold ${player.evaluated ? "text-[#78d4aa]" : "text-[#f2c36b]"}`}
              >
                {player.evaluated ? "Evaluated" : "Awaiting evaluation"}
              </Text>
              {player.rating != null && (
                <Text className="mt-1 text-xs font-black text-white">
                  {player.rating.toFixed(1)}/10
                </Text>
              )}
            </View>
          </Pressable>
        ))}
        <Text className="mb-3 mt-3 text-base font-bold text-white">Quick actions</Text>
        <ActionCard
          title="Open player workspace"
          body="Review your assigned player records and development details."
          icon="people-outline"
          onPress={() => router.push("/(tabs)/players")}
        />
        <ActionCard
          title="Review evaluations"
          body="Record and update tactical, physical, technical, and mindset assessments."
          icon="clipboard-outline"
          onPress={() => router.push("/(tabs)/evaluations")}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

export default function DashboardScreen() {
  const { context, refresh } = useTouchlineAuth();
  const [refreshing, setRefreshing] = useState(false);
  const metricsQuery = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics", context?.academy?.id],
    queryFn: () => loadDashboardMetrics(context!.academy!.id),
    enabled: context?.role !== "coach" && Boolean(context?.academy),
    retry: 1,
  });
  const coachQuery = useQuery<CoachDashboardData>({
    queryKey: ["coach-dashboard", context?.academy?.id, context?.profile.id],
    queryFn: () => loadCoachDashboardData(context!.academy!.id, context!.profile.id),
    enabled: context?.role === "coach" && Boolean(context?.academy),
    retry: 1,
  });
  if (!context) return null;
  if (context.role === "super_admin")
    return <SuperAdminDashboard userName={context.profile.full_name} refresh={refresh} />;
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), metricsQuery.refetch()]);
    setRefreshing(false);
  };
  const academyName = context.academy?.name ?? "Touchline Academy";
  const roleLabel = ROLE_LABELS[context.role];
  const subscriptionLabel = context.subscription?.plan_key
    ? context.subscription.plan_key.toUpperCase()
    : "TRIAL";
  const statusLabel =
    context.subscription?.status === "active" && context.subscription.current_period_end
      ? `Active until ${displayDate(context.subscription.current_period_end)}`
      : context.subscription?.status === "trialing" && context.subscription.trial_ends_at
        ? `Trial until ${displayDate(context.subscription.trial_ends_at)}`
        : (context.subscription?.status?.replace("_", " ") ?? "Workspace connected");
  if (context.role === "coach") {
    return (
      <CoachDashboard
        academyName={academyName}
        userName={context.profile.full_name}
        data={coachQuery.data}
        loading={coachQuery.isLoading}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await Promise.all([refresh(), coachQuery.refetch()]);
          setRefreshing(false);
        }}
      />
    );
  }
  return (
    <ScreenContainer
      containerClassName="bg-[#071521]"
      safeAreaClassName="bg-[#071521]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#78d4aa"
            colors={["#78d4aa"]}
          />
        }
      >
        <AcademyIdentity
          name={academyName}
          role={context.role}
          userName={context.profile.full_name}
        />
        <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-[#1e3a52] bg-[#10263a] px-4 py-3">
          <View className="flex-1 flex-row items-center">
            <Ionicons name="radio" size={16} color="#78d4aa" />
            <Text className="ml-2 text-sm font-semibold text-[#d5f5e5]">{statusLabel}</Text>
          </View>
          <Text className="text-xs font-bold uppercase tracking-wider text-[#78d4aa]">
            {subscriptionLabel}
          </Text>
        </View>
        <Text className="mb-1 text-2xl font-black text-white">Your academy at a glance</Text>
        <Text className="mb-5 text-sm leading-5 text-[#aab7c7]">
          {roleLabel} tools, live from the same Touchline workspace used on the web.
        </Text>
        {context.role === "academy_manager" || context.role === "academy_admin" ? (
          <View className="mb-6">
            <View className="mb-3 flex-row gap-3">
              <MetricCard
                label="Total coaches"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.coaches ?? 0)}
                icon="people-outline"
              />
              <MetricCard
                label="Active coaches"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.activeCoaches ?? 0)}
                icon="person-outline"
                accent="#78d4aa"
              />
            </View>
            <View className="mb-3 flex-row gap-3">
              <MetricCard
                label="Players registered"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.players ?? 0)}
                icon="people-outline"
                accent="#8bb8ff"
              />
              <MetricCard
                label="Players evaluated"
                value={
                  metricsQuery.isLoading ? "—" : String(metricsQuery.data?.evaluatedPlayers ?? 0)
                }
                icon="checkmark-circle-outline"
                accent="#dca7ff"
              />
            </View>
            <View className="mb-3 flex-row gap-3">
              <MetricCard
                label="Not evaluated"
                value={
                  metricsQuery.isLoading ? "—" : String(metricsQuery.data?.notEvaluatedPlayers ?? 0)
                }
                icon="time-outline"
                accent="#f2c36b"
              />
              <MetricCard
                label="Players this month"
                value={
                  metricsQuery.isLoading ? "—" : String(metricsQuery.data?.playersThisMonth ?? 0)
                }
                icon="calendar-outline"
              />
            </View>
            <View className="flex-row gap-3">
              <MetricCard
                label="Evaluations this month"
                value={
                  metricsQuery.isLoading
                    ? "—"
                    : String(metricsQuery.data?.evaluationsThisMonth ?? 0)
                }
                icon="clipboard-outline"
                accent="#8bb8ff"
              />
              <View className="flex-1" />
            </View>
          </View>
        ) : (
          <>
            <View className="mb-3 flex-row gap-3">
              <MetricCard
                label="Players"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.players ?? 0)}
                icon="people-outline"
              />
              <MetricCard
                label="Evaluations"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.evaluations ?? 0)}
                icon="clipboard-outline"
                accent="#8bb8ff"
              />
            </View>
            <View className="mb-6 flex-row gap-3">
              <MetricCard
                label="Coaches"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.coaches ?? 0)}
                icon="person-outline"
                accent="#f2c36b"
              />
              <MetricCard
                label="Managers"
                value={metricsQuery.isLoading ? "—" : String(metricsQuery.data?.managers ?? 0)}
                icon="shield-checkmark-outline"
                accent="#dca7ff"
              />
            </View>
          </>
        )}
        {metricsQuery.error && (
          <Text className="mb-4 text-sm text-[#ffd7de]">
            Academy metrics are unavailable right now.
          </Text>
        )}
        <Text className="mb-3 text-base font-bold text-white">Quick actions</Text>
        <ActionCard
          title="Open player workspace"
          body="Review player records, teams, seasons, and development details."
          icon="people-outline"
          onPress={() => router.push("/(tabs)/players")}
        />
        <ActionCard
          title="Review evaluations"
          body="Keep coach assessments and next development steps visible."
          icon="clipboard-outline"
          onPress={() => router.push("/(tabs)/evaluations")}
        />
        {context.role === "academy_admin" && (
          <ActionCard
            title="Manage your academy"
            body="Review subscription, managers, branding, reports, and activity."
            icon="settings-outline"
            onPress={() => router.push("/more")}
          />
        )}
        {context.role === "academy_manager" && (
          <ActionCard
            title="Run academy operations"
            body="Manage day-to-day player, coach, and evaluation workflows."
            icon="construct-outline"
            onPress={() => router.push("/more")}
          />
        )}
        <View className="mt-4 rounded-2xl border border-[#1e3a52] bg-[#0b1c2d] p-4">
          <Text className="text-xs font-semibold uppercase tracking-wider text-[#78d4aa]">
            Touchline promise
          </Text>
          <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
            Keep player progress visible, keep every role clear, and keep your academy moving
            forward.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
