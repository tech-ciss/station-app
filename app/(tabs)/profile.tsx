import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, ScreenContainer, StatusBadge } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-2">
      <Text className="text-bodySmall text-yely-muted">{label}</Text>
      <Text className="flex-1 text-right text-bodySmall font-bold text-yely-text">{value}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <Pressable accessibilityRole="button" className="min-h-touch flex-row items-center gap-3 py-2">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-yely-primaryLight">
        <Ionicons name={icon} size={18} color="#0F9D58" />
      </View>
      <Text className="flex-1 text-body font-semibold text-yely-text">{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#7A8C86" />
    </Pressable>
  );
}

export default function ProfileRoute() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentSession = useSessionStore((state) => state.currentSession);

  const fullName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Pompiste YELY";
  const initials = getInitials(fullName) || "YL";
  const hasSession = currentSession?.isActive === true;

  function handleLogout() {
    logout();
  }

  return (
    <ScreenContainer>
      <View className="items-center gap-2 py-2">
        <View className="h-[78px] w-[78px] items-center justify-center rounded-full border-[3px] border-yely-primary bg-yely-primaryLight">
          <Text className="text-headingLarge font-bold text-yely-primaryDark">{initials}</Text>
        </View>
        <Text className="text-headingMedium font-bold text-yely-text">{fullName}</Text>
        <Text className="text-bodySmall font-medium text-yely-muted">{user?.role ?? "CASHIER"}</Text>
        <StatusBadge label="Certifié YELY" type="success" />
      </View>

      <View
        className={`flex-row items-center gap-3 rounded-yely border p-4 ${
          hasSession
            ? "border-yely-primary/20 bg-yely-primaryLight"
            : "border-yely-border bg-yely-surfaceSecondary"
        }`}
      >
        <View
          className={`h-3 w-3 rounded-full ${hasSession ? "bg-yely-primary" : "bg-yely-muted"}`}
        />
        <Text
          className={`flex-1 text-bodySmall font-semibold ${
            hasSession ? "text-yely-primaryDark" : "text-yely-muted"
          }`}
        >
          {hasSession
            ? `Session active - ${currentSession.pumpName}`
            : "Aucune session de travail active"}
        </Text>
      </View>

      <Card className="gap-1">
        <Text className="mb-1 text-caption font-bold uppercase text-yely-muted">Informations</Text>
        <InfoRow label="Téléphone" value={user?.phone ?? "-"} />
        <View className="h-px bg-yely-border" />
        <InfoRow label="Rôle" value={String(user?.role ?? "CASHIER")} />
        <View className="h-px bg-yely-border" />
        <InfoRow label="Statut" value={String(user?.status ?? "ACTIVE")} />
        <View className="h-px bg-yely-border" />
        <InfoRow label="Station" value={user?.stationName ?? user?.stationId ?? "-"} />
        {user?.stationCode ? (
          <>
            <View className="h-px bg-yely-border" />
            <InfoRow label="Code station" value={user.stationCode} />
          </>
        ) : null}
      </Card>

      <Card className="gap-1">
        <Text className="mb-1 text-caption font-bold uppercase text-yely-muted">Paramètres</Text>
        <MenuItem icon="notifications-outline" label="Notifications" />
        <View className="h-px bg-yely-border" />
        <MenuItem icon="lock-closed-outline" label="Sécurité et PIN" />
        <View className="h-px bg-yely-border" />
        <MenuItem icon="help-circle-outline" label="Aide et support" />
      </Card>

      <Button title="Se déconnecter" variant="danger" onPress={handleLogout} />

      <Text className="text-center text-caption font-medium text-yely-muted">
        YELY Station V3
      </Text>
    </ScreenContainer>
  );
}
