import { Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Button, Card, StatusBadge } from "@/components/ui";
import type { TransactionPhoto } from "@/types/transaction";

type PumpPhotoPickerProps = {
  photo: TransactionPhoto | null;
  onChange: (photo: TransactionPhoto | null) => void;
};

export function PumpPhotoPicker({ photo, onChange }: PumpPhotoPickerProps) {
  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange({
        id: `photo-camera-${Date.now()}`,
        uri: result.assets[0].uri,
        source: "camera"
      });
    }
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ["images"],
      quality: 0.7
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange({
        id: `photo-gallery-${Date.now()}`,
        uri: result.assets[0].uri,
        source: "gallery"
      });
    }
  }

  return (
    <Card className="gap-4">
      {photo ? (
        <View className="gap-3">
          <View className="overflow-hidden rounded-yely border border-yely-border bg-yely-surfaceSecondary">
            <Image
              source={{ uri: photo.uri }}
              resizeMode="cover"
              style={{ width: "100%", height: 190, backgroundColor: "#F0F4F2" }}
            />
          </View>
          <View className="flex-row items-center justify-between gap-3">
            {/* <View className="flex-1 gap-1">
              <StatusBadge
                label={photo.source === "camera" ? "Photo prise" : "Photo galerie"}
                type="success"
              />
              <Text className="text-caption text-yely-muted" numberOfLines={1}>
                Justificatif prêt à envoyer
              </Text>
            </View> */}
            <Button title="Retirer" variant="outline" onPress={() => onChange(null)} />
          </View>
          <Button title="Remplacer photo" variant="secondary" onPress={pickFromCamera} />
        </View>
      ) : (
        <View className="gap-3">
          <View className="h-32 items-center justify-center rounded-yely border border-dashed border-yely-border bg-yely-surfaceSecondary">
            <Text className="text-bodySmall font-semibold text-yely-muted">Aucune photo</Text>
          </View>
          <Button title="Prendre une photo" onPress={pickFromCamera} />
          {/* <Button title="Choisir depuis la galerie" variant="secondary" onPress={pickFromGallery} /> */}
        </View>
      )}
    </Card>
  );
}
