import type { ComponentProps } from "react";
import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNavigationState } from "@/hooks/use-navigation-state";
import { appRoutes, canAccessSessionFeatures } from "@/navigation/guards";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const navItems = [
  {
    label: "Scanner",
    href: appRoutes.scan,
    match: "/scan",
    icon: "qr-code" as IoniconName,
    iconOutline: "qr-code-outline" as IoniconName,
  },
  {
    label: "Historique",
    href: appRoutes.history,
    match: "/history",
    icon: "receipt" as IoniconName,
    iconOutline: "receipt-outline" as IoniconName,
  },
  {
    label: "Service",
    href: appRoutes.service,
    match: "/service",
    icon: "speedometer" as IoniconName,
    iconOutline: "speedometer-outline" as IoniconName,
  },
  {
    label: "Profil",
    href: appRoutes.profile,
    match: "/profile",
    icon: "person-circle" as IoniconName,
    iconOutline: "person-circle-outline" as IoniconName,
  },
] as const;

const activeColor = "#0F9D58";
const inactiveColor = "#6B7F79";

export function SessionBottomNav() {
  const pathname = usePathname();
  const navigationState = useNavigationState();
  const insets = useSafeAreaInsets();

  if (!canAccessSessionFeatures(navigationState)) {
    return null;
  }

  return (
    <View
      className="bg-white px-2 pt-2"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.06)",
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 16,
      }}
    >
      <View className="flex-row">
        {navItems.map((item) => {
          const isActive = pathname.endsWith(item.match);

          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable className="flex-1 items-center justify-center py-1">
                {/* Fond pill actif */}
                <View
                  className={`items-center justify-center gap-1 rounded-yely px-3 py-2 ${
                    isActive ? "bg-yely-primaryLight" : ""
                  }`}
                  style={{ minWidth: 56 }}
                >
                  <Ionicons
                    name={isActive ? item.icon : item.iconOutline}
                    size={24}
                    color={isActive ? activeColor : inactiveColor}
                  />
                  <Text
                    className={`text-[11px] font-bold ${
                      isActive ? "text-yely-primaryDark" : "text-yely-muted"
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
