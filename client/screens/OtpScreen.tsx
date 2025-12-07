import React, { useState, useRef } from "react";
import { View, StyleSheet, TextInput, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { verifyOtp, sendOtp } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "Otp">;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const { theme, isDark } = useTheme();
  const { login } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const phone = route.params.phone;
  const maskedPhone = phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);

  function handleOtpChange(value: string, index: number) {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(otpCode: string) {
    setIsLoading(true);
    setError("");

    try {
      const result = await verifyOtp(phone, otpCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await login(result.user);
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    try {
      await sendOtp(phone);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Enter Verification Code</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            We sent a 6-digit code to {maskedPhone}
          </ThemedText>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: digit ? (isDark ? Colors.dark.accent : Colors.light.accent) : "transparent",
                },
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <ThemedText style={[styles.error, { color: isDark ? Colors.dark.error : Colors.light.error }]}>
            {error}
          </ThemedText>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="large" color={isDark ? Colors.dark.accent : Colors.light.accent} style={styles.loader} />
        ) : null}

        <Pressable onPress={handleResend} style={styles.resendButton}>
          <ThemedText style={[styles.resendText, { color: theme.link }]}>
            Didn't receive the code? Resend
          </ThemedText>
        </Pressable>
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
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.sm,
    textAlign: "center",
    ...Typography.h3,
    borderWidth: 2,
  },
  error: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  resendButton: {
    alignSelf: "center",
    padding: Spacing.md,
  },
  resendText: {
    ...Typography.body,
  },
});
