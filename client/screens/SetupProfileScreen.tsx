import React, { useState } from "react";
import { View, StyleSheet, TextInput, ActivityIndicator, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { updateProfile } from "@/lib/api";

export default function SetupProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = name.trim().length >= 2;

  async function handleSubmit() {
    if (!isValid || !user) return;

    setIsLoading(true);
    setError("");

    try {
      const updated = await updateProfile(user.id, { name: name.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateUser(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
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
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
            <Feather name="user" size={48} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.title}>Set Up Your Profile</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your name to get started
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.label}>Your Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
          />

          {error ? (
            <ThemedText style={[styles.error, { color: isDark ? Colors.dark.error : Colors.light.error }]}>
              {error}
            </ThemedText>
          ) : null}

          <Button
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            style={[
              styles.button,
              { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent },
            ]}
          >
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : "Continue"}
          </Button>
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
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
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
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  error: {
    ...Typography.small,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.sm,
  },
});
