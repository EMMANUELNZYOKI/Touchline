import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useTouchlineAuth } from "@/hooks/use-touchline-auth";
import EntryScreen from "../index";

export default function TabLayout() {
  const { loading, context } = useTouchlineAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  if (loading) {
    return <EntryScreen redirectAuthenticated={false} showSplash />;
  }
  if (!context) {
    return <EntryScreen redirectAuthenticated={false} showSplash={false} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#78d4aa",
        tabBarInactiveTintColor: "#aab7c7",
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 1 },
        tabBarItemStyle: { paddingVertical: 2 },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: Math.max(tabBarHeight, 72),
          backgroundColor: "#0b1c2d",
          borderTopColor: "#2b5268",
          borderTopWidth: 1,
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
      <Tabs.Screen name="managers" options={{ href: context?.role === "academy_admin" ? undefined : null, title: "Managers", tabBarIcon: ({ color }) => <Ionicons size={24} name="shield-checkmark-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="coaches" options={{ href: context?.role === "academy_manager" ? undefined : null, title: "Coaches", tabBarIcon: ({ color }) => <Ionicons size={24} name="person-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="players" options={{ href: context?.role === "super_admin" ? null : undefined, title: "Players", tabBarIcon: ({ color }) => <Ionicons size={24} name="people-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="evaluations" options={{ href: context?.role === "super_admin" ? null : undefined, title: "Evaluations", tabBarIcon: ({ color }) => <Ionicons size={24} name="clipboard-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="billing" options={{ href: context?.role === "academy_admin" ? undefined : null, title: "Billing", tabBarIcon: ({ color }) => <Ionicons size={24} name="card-outline" color={color == null ? undefined : String(color)} /> }} />
      <Tabs.Screen name="more" options={{ href: context?.role === "super_admin" ? null : undefined, title: "More", tabBarIcon: ({ color }) => <Ionicons size={24} name="ellipsis-horizontal-circle-outline" color={color == null ? undefined : String(color)} /> }} />
    </Tabs>
  );
}
