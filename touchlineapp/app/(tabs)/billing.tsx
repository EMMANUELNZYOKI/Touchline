import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AcademyIdentity } from "@/components/touchline-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import { fetchBilling, startMpesaCheckout, type BillingPlan } from "@/lib/touchline/billing";

function formatAmount(plan: BillingPlan) {
  return `${plan.currency} ${Number(plan.amount).toLocaleString("en-KE")}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function BillingScreen() {
  const { context } = useTouchlineAuth();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const billingQuery = useQuery({
    queryKey: ["mobile-billing", context?.academy?.id],
    queryFn: fetchBilling,
    enabled: context?.role === "academy_admin",
  });
  const academyId = context?.academy?.id;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && academyId) {
        void queryClient.invalidateQueries({ queryKey: ["mobile-billing", academyId] });
      }
    });
    return () => subscription.remove();
  }, [academyId, queryClient]);
  const checkoutMutation = useMutation({
    mutationFn: ({ planKey, phoneNumber }: { planKey: string; phoneNumber: string }) =>
      startMpesaCheckout(planKey, phoneNumber),
    onSuccess: async (checkout) => {
      setMessage(
        `Checkout prepared for ${checkout.planKey.toUpperCase()}. Approve the M-Pesa prompt after the Paystack page opens.`,
      );
      try {
        if (await Linking.canOpenURL(checkout.link)) await Linking.openURL(checkout.link);
        else
          setMessage(
            "Checkout is ready, but this device cannot open the payment link. Try from the web dashboard.",
          );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Checkout is ready, but the payment link could not be opened.",
        );
      }
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Could not start M-Pesa checkout."),
    onSettled: () => setSelectedPlan(null),
  });

  if (!context || context.role !== "academy_admin") return null;
  const subscription = billingQuery.data?.subscription ?? context.subscription;
  const subscribe = (planKey: string) => {
    if (!phone.trim()) {
      setMessage("Enter the Safaricom number that should receive the M-Pesa prompt.");
      return;
    }
    setMessage(null);
    setSelectedPlan(planKey);
    checkoutMutation.mutate({ planKey, phoneNumber: phone.trim() });
  };

  return (
    <ScreenContainer containerClassName="bg-[#071521]" safeAreaClassName="bg-[#071521]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <AcademyIdentity
          name={context.academy?.name ?? "Your academy"}
          role={context.role}
          userName={context.profile.full_name}
        />
        <Text className="text-2xl font-black text-white">Subscription</Text>
        <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
          Choose the package that fits your academy. Payment stays inside the existing secure
          Touchline Paystack flow.
        </Text>

        <View className="mt-5 rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wider text-[#78d4aa]">
                Current workspace
              </Text>
              <Text className="mt-2 text-lg font-black capitalize text-white">
                {subscription?.plan_key ?? "starter"} ·{" "}
                {subscription?.status?.replace("_", " ") ?? "trialing"}
              </Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={28} color="#78d4aa" />
          </View>
          <Text className="mt-3 text-sm text-[#aab7c7]">
            {subscription?.status === "active"
              ? `Active until ${formatDate(subscription.current_period_end)}`
              : subscription?.status === "trialing"
                ? `Trial ends ${formatDate(subscription.trial_ends_at)}`
                : "Renew to restore full write access."}
          </Text>
        </View>

        <Text className="mb-3 mt-7 text-base font-bold text-white">Pay with M-Pesa</Text>
        <Text className="mb-3 text-sm text-[#aab7c7]">
          Enter the Safaricom number that should receive the payment prompt.
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="07XX XXX XXX"
          placeholderTextColor="#71839a"
          keyboardType="phone-pad"
          className="rounded-2xl border border-[#2b4862] bg-[#0b1c2d] px-4 py-4 text-base text-white"
        />
        {message && (
          <Text className="mt-3 rounded-2xl bg-[#173f4a] px-4 py-3 text-sm leading-5 text-[#d5f5e5]">
            {message}
          </Text>
        )}

        {billingQuery.isLoading && (
          <View className="items-center py-10">
            <ActivityIndicator color="#78d4aa" />
            <Text className="mt-3 text-sm text-[#aab7c7]">Loading packages…</Text>
          </View>
        )}
        {billingQuery.error && (
          <Text className="mt-5 text-sm leading-5 text-[#ffd7de]">
            Packages could not be loaded. Please try again from the web dashboard.
          </Text>
        )}
        <View className="mt-5 gap-3">
          {billingQuery.data?.plans.map((plan) => {
            const isCurrent =
              subscription?.plan_key === plan.plan_key && subscription?.status === "active";
            const isSelected = selectedPlan === plan.plan_key;
            return (
              <View
                key={plan.plan_key}
                className="rounded-3xl border border-[#1e3a52] bg-[#10263a] p-5"
                style={plan.plan_key === "pro" ? { borderColor: "#78d4aa" } : undefined}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-xs font-bold uppercase tracking-[2px] text-[#78d4aa]">
                      {plan.name}
                    </Text>
                    <Text className="mt-2 text-2xl font-black text-white">
                      {formatAmount(plan)}
                      <Text className="text-sm font-normal text-[#aab7c7]"> / month</Text>
                    </Text>
                    <Text className="mt-2 text-sm leading-5 text-[#aab7c7]">
                      {plan.description}
                    </Text>
                  </View>
                  {plan.plan_key === "pro" && (
                    <View className="rounded-full bg-[#78d4aa] px-3 py-1">
                      <Text className="text-[10px] font-black uppercase text-[#071521]">
                        Complete
                      </Text>
                    </View>
                  )}
                </View>
                <View className="my-4 h-px bg-[#1e3a52]" />
                {plan.feature_summary.slice(0, 5).map((feature) => (
                  <View key={feature} className="mb-2 flex-row items-start">
                    <Ionicons name="checkmark-circle" size={16} color="#78d4aa" />
                    <Text className="ml-2 flex-1 text-sm leading-5 text-[#d5dfea]">{feature}</Text>
                  </View>
                ))}
                <Pressable
                  onPress={() => subscribe(plan.plan_key)}
                  disabled={isSelected || checkoutMutation.isPending}
                  className="mt-3 min-h-[50px] items-center justify-center rounded-2xl bg-[#78d4aa] active:opacity-80"
                  style={{
                    minHeight: 52,
                    marginTop: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 16,
                    backgroundColor: "#78d4aa",
                    opacity: isSelected || checkoutMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {isSelected ? (
                    <ActivityIndicator color="#071521" />
                  ) : (
                    <Text className="font-black text-[#071521]">
                      {isCurrent ? "Renew with M-Pesa" : `Choose ${plan.name}`}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        <Text className="mt-6 text-center text-xs leading-5 text-[#71839a]">
          Payments are verified by the existing Touchline Paystack webhook. A successful payment
          activates the selected plan for an exact 30-day period.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
