import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { sendOtp } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidPhone = phone.length >= 10;

  async function handleSendOtp() {
    if (!isValidPhone) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const fullPhone = countryCode + phone;
      const result = await sendOtp(fullPhone);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate("Otp", { phone: fullPhone });
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.title}>CashSwap</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Exchange cash with trusted people nearby
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Phone Number</ThemedText>
          <View style={styles.phoneRow}>
            <View style={[styles.countryCode, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText style={styles.countryCodeText}>{countryCode}</ThemedText>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                },
              ]}
              placeholder="Enter phone number"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          {error ? (
            <ThemedText style={[styles.error, { color: isDark ? Colors.dark.error : Colors.light.error }]}>
              {error}
            </ThemedText>
          ) : null}

          <Button
            onPress={handleSendOtp}
            disabled={!isValidPhone || isLoading}
            style={[
              styles.button,
              { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              "Get OTP"
            )}
          </Button>

          <ThemedText style={[styles.disclaimer, { color: theme.textSecondary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  label: {
    ...Typography.small,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  phoneRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  countryCode: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  countryCodeText: {
    ...Typography.body,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    ...Typography.body,
  },
  error: {
    ...Typography.small,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.sm,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
