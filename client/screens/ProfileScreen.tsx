import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function maskPhone(phone: string) {
    if (phone.length < 8) return phone;
    return phone.slice(0, 4) + "****" + phone.slice(-4);
  }

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await logout();
            } catch (error) {
              console.error(error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  }

  if (!user) return null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}>
            <ThemedText style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </ThemedText>
          </View>
          <ThemedText style={styles.name}>{user.name || "User"}</ThemedText>
          <View style={styles.verifiedRow}>
            <Feather name="check-circle" size={16} color={Colors.light.success} />
            <ThemedText style={[styles.phone, { color: theme.textSecondary }]}>
              {maskPhone(user.phone)}
            </ThemedText>
          </View>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="star" size={24} color={Colors.light.warning} />
              <ThemedText style={styles.statValue}>{user.rating.toFixed(1)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.backgroundSecondary }]} />
            <View style={styles.statItem}>
              <Feather name="repeat" size={24} color={isDark ? Colors.dark.success : Colors.light.success} />
              <ThemedText style={styles.statValue}>{user.completedExchanges}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Exchanges</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.backgroundSecondary }]} />
            <View style={styles.statItem}>
              <Feather name="calendar" size={24} color={isDark ? Colors.dark.info : Colors.light.info} />
              <ThemedText style={styles.statValue}>
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Joined</ThemedText>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Settings</ThemedText>
          
          <Card style={styles.menuCard}>
            <Pressable style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? Colors.dark.info + "20" : Colors.light.info + "20" }]}>
                <Feather name="edit-2" size={18} color={isDark ? Colors.dark.info : Colors.light.info} />
              </View>
              <ThemedText style={styles.menuText}>Edit Profile</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Card>

          <Card style={styles.menuCard}>
            <Pressable style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? Colors.dark.warning + "20" : Colors.light.warning + "20" }]}>
                <Feather name="bell" size={18} color={isDark ? Colors.dark.warning : Colors.light.warning} />
              </View>
              <ThemedText style={styles.menuText}>Notifications</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Card>

          <Card style={styles.menuCard}>
            <Pressable style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? Colors.dark.success + "20" : Colors.light.success + "20" }]}>
                <Feather name="shield" size={18} color={isDark ? Colors.dark.success : Colors.light.success} />
              </View>
              <ThemedText style={styles.menuText}>Privacy & Security</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Support</ThemedText>
          
          <Card style={styles.menuCard}>
            <Pressable style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="help-circle" size={18} color={theme.text} />
              </View>
              <ThemedText style={styles.menuText}>Help Center</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Card>

          <Card style={styles.menuCard}>
            <Pressable style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="file-text" size={18} color={theme.text} />
              </View>
              <ThemedText style={styles.menuText}>Terms of Service</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Card>
        </View>

        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={[styles.logoutButton, { backgroundColor: isDark ? Colors.dark.error + "15" : Colors.light.error + "15" }]}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={isDark ? Colors.dark.error : Colors.light.error} />
          ) : (
            <>
              <Feather name="log-out" size={20} color={isDark ? Colors.dark.error : Colors.light.error} />
              <ThemedText style={[styles.logoutText, { color: isDark ? Colors.dark.error : Colors.light.error }]}>
                Logout
              </ThemedText>
            </>
          )}
        </Pressable>

        <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
          CashSwap v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  phone: {
    ...Typography.body,
  },
  statsCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Typography.h4,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
  },
  statDivider: {
    width: 1,
    height: 50,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  menuCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  menuText: {
    flex: 1,
    ...Typography.body,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    ...Typography.body,
    fontWeight: "600",
  },
  version: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
});
