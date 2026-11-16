import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, Platform, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";

export default function TabLayout() {
  const colors = useColors();
  const { loading, context } = useTouchlineAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  if (loading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#17202f" }}><ActivityIndicator size="large" color="#d6b45a" /></View>;
  }

  if (!context) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home-outline" color={color == null ? undefined : String(color)} />,
        }}
      />
      <Tabs.Screen name="players" options={{ href: context?.role === "super_admin" ? null : undefined, title: "Players", tabBarIcon: ({ color }) => <Ionicons size={24} name="people-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="evaluations" options={{ href: context?.role === "super_admin" ? null : undefined, title: "Reviews", tabBarIcon: ({ color }) => <Ionicons size={24} name="clipboard-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons size={24} name="person-circle-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="billing" options={{ href: context?.role === "academy_admin" ? undefined : null, title: "Billing", tabBarIcon: ({ color }) => <Ionicons size={24} name="card-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="more" options={{ href: context?.role === "super_admin" ? null : undefined, title: "More", tabBarIcon: ({ color }) => <Ionicons size={24} name="ellipsis-horizontal-circle-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="managers" options={{ href: null, title: "Managers" }} />
      <Tabs.Screen name="coaches" options={{ href: null, title: "Coaches" }} />
      <Tabs.Screen name="reports" options={{ href: null, title: "Reports" }} />
      <Tabs.Screen name="activity" options={{ href: null, title: "Activity" }} />
      <Tabs.Screen name="settings" options={{ href: null, title: "Settings" }} />
    </Tabs>
  );
}
