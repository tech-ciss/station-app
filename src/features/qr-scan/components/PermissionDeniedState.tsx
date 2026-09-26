import { Text, View } from "react-native";

import { Button, Card, ScreenContainer } from "@/components/ui";

type PermissionDeniedStateProps = {
  onRequestPermission: () => void;
};

export function PermissionDeniedState({ onRequestPermission }: PermissionDeniedStateProps) {
  return (
    <ScreenContainer contentClassName="justify-center">
      <Card className="gap-4">
        <View className="gap-2">
          <Text className="text-headingMedium font-bold text-yely-text">Accès caméra requis</Text>
          <Text className="text-body text-yely-muted">
            Autorisez l'accès à la caméra pour scanner les QR chauffeurs.
          </Text>
        </View>
        <Button title="Autoriser" onPress={onRequestPermission} />
      </Card>
    </ScreenContainer>
  );
}
