import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Input } from "@/components/ui";
import { useSingleFlight } from "@/hooks/use-single-flight";
import { useAuthStore } from "@/store/auth.store";
import { isValidPhone, normalizePhoneForApi, sanitizePhoneInput } from "@/utils/phone";

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isLoginLoading = useAuthStore((state) => state.isLoginLoading);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const runLogin = useSingleFlight();
  const insets = useSafeAreaInsets();

  const [stationCode, setStationCode] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = stationCode.trim().length > 0 && phone.trim().length > 0 && pin.length === 4;

  function clearErrors() {
    clearAuthError();
    setLocalError(null);
  }

  async function handleLogin() {
    const normalizedStationCode = stationCode.trim().toUpperCase();
    const normalizedPhone = normalizePhoneForApi(phone);
    const normalizedPin = pin.trim();

    if (!normalizedStationCode) {
      setLocalError("Le code station est obligatoire.");
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      setLocalError("Numéro de téléphone invalide.");
      return;
    }
    if (!/^\d{4}$/.test(normalizedPin)) {
      setLocalError("Le PIN doit contenir exactement 4 chiffres.");
      return;
    }

    await runLogin(async () => {
      try {
        await login({
          stationCode: normalizedStationCode,
          phone: normalizedPhone,
          pin: normalizedPin,
        });
      } catch {
        // L'erreur est exposée via authError
      }
    });
  }

  const displayError = localError ?? authError;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-yely-primaryDeep"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Hero header ── */}
      <View
        className="items-start justify-end px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: 32 }}
      >
        <Image
          source={require("../../../assets/Dark-version.png")}
          style={{ height: 36, width: 112, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text className="text-[34px] font-bold text-white" style={{ lineHeight: 40 }}>
          YELY Station
        </Text>
        <Text className="mt-1 text-body font-medium text-white" style={{ opacity: 0.7 }}>
          Espace caissier terrain
        </Text>
      </View>

      {/* ── Feuille formulaire ── */}
      <ScrollView
        className="flex-1 rounded-t-[28px] bg-yely-background"
        contentContainerStyle={{ padding: 24, paddingBottom: Math.max(insets.bottom, 24) + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-6 text-headingMedium font-bold text-yely-text">Connexion</Text>

        <View className="gap-4">
          {/* Code station */}
          <Input
            label="Code station"
            autoCapitalize="characters"
            autoCorrect={false}
            value={stationCode}
            onChangeText={(value) => {
              clearErrors();
              setStationCode(value.toUpperCase());
            }}
            placeholder="Ex: ST-RMPCE2"
            leftSlot={<Ionicons name="business-outline" size={18} color="#6B7F79" />}
          />

          {/* Téléphone */}
          <Input
            label="Téléphone Côte d'Ivoire"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            value={phone}
            onChangeText={(value) => {
              clearErrors();
              setPhone(sanitizePhoneInput(value));
            }}
            placeholder="Ex: 0700000000"
            hint="L'indicatif +225 est ajouté automatiquement."
            leftSlot={<Ionicons name="call-outline" size={18} color="#6B7F79" />}
          />

          {/* PIN */}
          <Input
            label="PIN (4 chiffres)"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={(value) => {
              clearErrors();
              setPin(value.replace(/\D/g, ""));
            }}
            placeholder="••••"
            leftSlot={<Ionicons name="lock-closed-outline" size={18} color="#6B7F79" />}
          />

          {/* Erreur */}
          {displayError ? (
            <View className="flex-row items-center gap-3 rounded-yely border border-yely-dangerMid bg-yely-dangerSoft p-4">
              <Ionicons name="alert-circle" size={18} color="#D32F2F" />
              <Text className="flex-1 text-bodySmall font-semibold text-yely-danger">
                {displayError}
              </Text>
            </View>
          ) : null}

          {/* Bouton */}
          <Button
            title={isLoginLoading ? "Connexion en cours..." : "Se connecter"}
            size="lg"
            disabled={!canSubmit || isLoginLoading}
            loading={isLoginLoading}
            onPress={() => void handleLogin()}
            className="mt-2"
          />
        </View>

        {/* Pied de page sécurité */}
        <View className="mt-8 flex-row items-center justify-center gap-2">
          <Ionicons name="shield-checkmark-outline" size={14} color="#6B7F79" />
          <Text className="text-caption font-semibold text-yely-muted">
            Connexion sécurisée — données protégées YELY
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
