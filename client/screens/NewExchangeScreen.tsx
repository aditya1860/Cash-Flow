import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, ActivityIndicator, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { publishLocation } from "@/lib/api";
import type { ExchangeMode } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewExchangeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [mode, setMode] = useState<ExchangeMode>("NEED_CASH");
  const [amount, setAmount] = useState("");
  const [conditions, setConditions] = useState("");
  const [radius, setRadius] = useState(5);
  const [shareLocation, setShareLocation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = amount && parseInt(amount) >= 100;

  async function handlePublish() {
    if (!isValid || !user) return;

    setIsLoading(true);
    setError("");

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => ({ coords: { latitude: 12.9716, longitude: 77.5946 } }));

      const offsetLat = (Math.random() - 0.5) * 0.002;
      const offsetLng = (Math.random() - 0.5) * 0.002;

      await publishLocation(user.id, {
        latitude: loc.coords.latitude + offsetLat,
        longitude: loc.coords.longitude + offsetLng,
        mode,
        amount: parseInt(amount),
        conditions: conditions.trim() || undefined,
        radius,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || "Failed to publish");
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
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.section}>
          <ThemedText style={styles.label}>What do you need?</ThemedText>
          <View style={styles.modeSelector}>
            <Pressable
              onPress={() => setMode("NEED_CASH")}
              style={[
                styles.modeButton,
                {
                  backgroundColor: mode === "NEED_CASH"
                    ? (isDark ? Colors.dark.needCash : Colors.light.needCash)
                    : theme.backgroundDefault,
                },
              ]}
            >
              <Feather
                name="download"
                size={20}
                color={mode === "NEED_CASH" ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.modeText,
                  { color: mode === "NEED_CASH" ? "#FFFFFF" : theme.text },
                ]}
              >
                I Need Cash
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode("HAVE_CASH")}
              style={[
                styles.modeButton,
                {
                  backgroundColor: mode === "HAVE_CASH"
                    ? (isDark ? Colors.dark.haveCash : Colors.light.haveCash)
                    : theme.backgroundDefault,
                },
              ]}
            >
              <Feather
                name="upload"
                size={20}
                color={mode === "HAVE_CASH" ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.modeText,
                  { color: mode === "HAVE_CASH" ? "#FFFFFF" : theme.text },
                ]}
              >
                I Have Cash
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Amount</ThemedText>
          <View style={[styles.amountInput, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.currencySymbol}>{"\u20B9"}</ThemedText>
            <TextInput
              style={[styles.amountField, { color: theme.text }]}
              placeholder="Enter amount"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
            Minimum: {"\u20B9"}100
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Conditions (optional)</ThemedText>
          <TextInput
            style={[
              styles.conditionsInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
              },
            ]}
            placeholder="E.g., UPI only, meet at coffee shop..."
            placeholderTextColor={theme.textSecondary}
            value={conditions}
            onChangeText={setConditions}
            multiline
            maxLength={200}
          />
          <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
            {conditions.length}/200
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Show to users within</ThemedText>
          <View style={styles.radiusSelector}>
            {[1, 3, 5, 10].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRadius(r)}
                style={[
                  styles.radiusButton,
                  {
                    backgroundColor: radius === r
                      ? (isDark ? Colors.dark.accent : Colors.light.accent)
                      : theme.backgroundDefault,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.radiusText,
                    { color: radius === r ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {r} km
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => setShareLocation(!shareLocation)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Feather name="map-pin" size={20} color={theme.text} />
            <View style={styles.toggleText}>
              <ThemedText style={styles.toggleLabel}>Share approximate location</ThemedText>
              <ThemedText style={[styles.toggleHint, { color: theme.textSecondary }]}>
                Your exact location is never shared
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.toggle,
              {
                backgroundColor: shareLocation
                  ? (isDark ? Colors.dark.success : Colors.light.success)
                  : theme.backgroundSecondary,
              },
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                { transform: [{ translateX: shareLocation ? 20 : 0 }] },
              ]}
            />
          </View>
        </Pressable>

        {error ? (
          <ThemedText style={[styles.error, { color: isDark ? Colors.dark.error : Colors.light.error }]}>
            {error}
          </ThemedText>
        ) : null}

        <Button
          onPress={handlePublish}
          disabled={!isValid || isLoading}
          style={[
            styles.publishButton,
            { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent },
          ]}
        >
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : "Publish Exchange"}
        </Button>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  modeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  modeText: {
    ...Typography.body,
    fontWeight: "600",
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
  },
  currencySymbol: {
    ...Typography.amount,
    marginRight: Spacing.sm,
  },
  amountField: {
    flex: 1,
    ...Typography.amount,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  conditionsInput: {
    height: 100,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    ...Typography.body,
    textAlignVertical: "top",
  },
  charCount: {
    ...Typography.caption,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  radiusSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  radiusButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  radiusText: {
    ...Typography.body,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    ...Typography.body,
    fontWeight: "500",
  },
  toggleHint: {
    ...Typography.caption,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  error: {
    ...Typography.small,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  publishButton: {
    marginTop: Spacing.sm,
  },
});
