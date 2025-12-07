import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getNearbyUsers, createExchangeRequest } from "@/lib/api";
import type { NearbyUser } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyUsers();
  }, []);

  async function fetchNearbyUsers() {
    if (!user) return;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => ({ coords: { latitude: 12.9716, longitude: 77.5946 } }));
      
      const users = await getNearbyUsers(user.id, loc.coords.latitude, loc.coords.longitude, 10);
      setNearbyUsers(users);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNearbyUsers();
  }, []);

  async function handleRequestExchange(nearbyUser: NearbyUser) {
    if (!user) return;
    setRequestingId(nearbyUser.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const request = await createExchangeRequest(user.id, {
        toUserId: nearbyUser.id,
        amount: nearbyUser.location.amount,
        mode: nearbyUser.location.mode === "NEED_CASH" ? "HAVE_CASH" : "NEED_CASH",
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("ChatDetail", {
        exchangeRequestId: request.id,
        otherUser: nearbyUser,
      });
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRequestingId(null);
    }
  }

  function handleUserPress(nearbyUser: NearbyUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UserProfile", { user: nearbyUser });
  }

  function renderMatchCard({ item }: { item: NearbyUser }) {
    const isNeedCash = item.location.mode === "NEED_CASH";
    const badgeColor = isNeedCash
      ? (isDark ? Colors.dark.needCash : Colors.light.needCash)
      : (isDark ? Colors.dark.haveCash : Colors.light.haveCash);

    return (
      <Card onPress={() => handleUserPress(item)} style={styles.matchCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: badgeColor }]}>
            <ThemedText style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.cardName}>{item.name}</ThemedText>
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <ThemedText style={styles.badgeText}>
                  {isNeedCash ? "Needs Cash" : "Has Cash"}
                </ThemedText>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <Feather name="star" size={14} color={Colors.light.warning} />
              <ThemedText style={[styles.cardRating, { color: theme.textSecondary }]}>
                {item.rating.toFixed(1)} ({item.completedExchanges} exchanges)
              </ThemedText>
            </View>
            <View style={styles.cardMeta}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.cardDistance, { color: theme.textSecondary }]}>
                {item.distance} km away
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={styles.cardAmount}>
          {"\u20B9"}{item.location.amount.toLocaleString("en-IN")}
        </ThemedText>

        {item.location.conditions ? (
          <ThemedText style={[styles.conditions, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.location.conditions}
          </ThemedText>
        ) : null}

        <Button
          onPress={() => handleRequestExchange(item)}
          disabled={requestingId === item.id}
          style={[styles.requestButton, { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent }]}
        >
          {requestingId === item.id ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            "Request Exchange"
          )}
        </Button>
      </Card>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="search" size={64} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { marginTop: Spacing.xl }]}>
          No matches found
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          There are no users nearby right now. Try again later or expand your search radius.
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={nearbyUsers}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.text}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  matchCard: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    ...Typography.h4,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    color: "#FFFFFF",
    ...Typography.caption,
    fontWeight: "600",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  cardRating: {
    ...Typography.small,
  },
  cardDistance: {
    ...Typography.small,
  },
  cardAmount: {
    ...Typography.amount,
    marginBottom: Spacing.sm,
  },
  conditions: {
    ...Typography.small,
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  requestButton: {
    height: 44,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: "center",
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
