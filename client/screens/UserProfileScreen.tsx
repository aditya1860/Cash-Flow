import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { createExchangeRequest, reportUser } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "UserProfile">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);

  const { user: nearbyUser } = route.params;
  const isNeedCash = nearbyUser.location?.mode === "NEED_CASH";
  const badgeColor = isNeedCash
    ? (isDark ? Colors.dark.needCash : Colors.light.needCash)
    : (isDark ? Colors.dark.haveCash : Colors.light.haveCash);

  async function handleRequestExchange() {
    if (!currentUser || !nearbyUser.location) return;

    setIsRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const request = await createExchangeRequest(currentUser.id, {
        toUserId: nearbyUser.id,
        amount: nearbyUser.location.amount,
        mode: nearbyUser.location.mode === "NEED_CASH" ? "HAVE_CASH" : "NEED_CASH",
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("ChatDetail", {
        exchangeRequestId: request.id,
        otherUser: nearbyUser,
      });
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRequesting(false);
    }
  }

  function handleReport() {
    Alert.alert(
      "Report User",
      "Why are you reporting this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspicious behavior",
          onPress: () => submitReport("Suspicious behavior"),
        },
        {
          text: "Inappropriate content",
          onPress: () => submitReport("Inappropriate content"),
        },
        {
          text: "Scam attempt",
          style: "destructive",
          onPress: () => submitReport("Scam attempt"),
        },
      ]
    );
  }

  async function submitReport(reason: string) {
    if (!currentUser) return;
    try {
      await reportUser(currentUser.id, {
        toUserId: nearbyUser.id,
        reason,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Report Submitted", "Thank you for helping keep CashSwap safe.");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: badgeColor }]}>
            <ThemedText style={styles.avatarText}>
              {nearbyUser.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.name}>{nearbyUser.name}</ThemedText>
          <View style={styles.verifiedRow}>
            <Feather name="check-circle" size={16} color={Colors.light.success} />
            <ThemedText style={[styles.verified, { color: theme.textSecondary }]}>
              Verified Phone
            </ThemedText>
          </View>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="star" size={24} color={Colors.light.warning} />
              <ThemedText style={styles.statValue}>{nearbyUser.rating.toFixed(1)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.backgroundSecondary }]} />
            <View style={styles.statItem}>
              <Feather name="repeat" size={24} color={isDark ? Colors.dark.success : Colors.light.success} />
              <ThemedText style={styles.statValue}>{nearbyUser.completedExchanges}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Exchanges</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.backgroundSecondary }]} />
            <View style={styles.statItem}>
              <Feather name="map-pin" size={24} color={isDark ? Colors.dark.info : Colors.light.info} />
              <ThemedText style={styles.statValue}>{nearbyUser.distance} km</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</ThemedText>
            </View>
          </View>
        </Card>

        {nearbyUser.location ? (
          <Card style={styles.exchangeCard}>
            <View style={styles.exchangeHeader}>
              <View style={[styles.modeBadge, { backgroundColor: badgeColor }]}>
                <ThemedText style={styles.modeBadgeText}>
                  {isNeedCash ? "Needs Cash" : "Has Cash"}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.exchangeAmount}>
              {"\u20B9"}{nearbyUser.location.amount.toLocaleString("en-IN")}
            </ThemedText>
            {nearbyUser.location.conditions ? (
              <View style={styles.conditionsRow}>
                <Feather name="info" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.conditions, { color: theme.textSecondary }]}>
                  {nearbyUser.location.conditions}
                </ThemedText>
              </View>
            ) : null}
          </Card>
        ) : null}

        <Button
          onPress={handleRequestExchange}
          disabled={isRequesting}
          style={[
            styles.requestButton,
            { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent },
          ]}
        >
          {isRequesting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            "Request Exchange"
          )}
        </Button>

        <Pressable onPress={handleReport} style={styles.reportButton}>
          <Feather name="flag" size={18} color={isDark ? Colors.dark.error : Colors.light.error} />
          <ThemedText style={[styles.reportText, { color: isDark ? Colors.dark.error : Colors.light.error }]}>
            Report User
          </ThemedText>
        </Pressable>
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
    paddingTop: Spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
  },
  name: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  verified: {
    ...Typography.body,
  },
  statsCard: {
    marginBottom: Spacing.lg,
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
  exchangeCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  exchangeHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  modeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  modeBadgeText: {
    color: "#FFFFFF",
    ...Typography.small,
    fontWeight: "600",
  },
  exchangeAmount: {
    ...Typography.amount,
    marginBottom: Spacing.sm,
  },
  conditionsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  conditions: {
    ...Typography.body,
    flex: 1,
  },
  requestButton: {
    marginBottom: Spacing.lg,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  reportText: {
    ...Typography.body,
  },
});
