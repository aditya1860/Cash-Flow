import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getChats } from "@/lib/api";
import type { Chat, User, ExchangeRequest } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ChatWithDetails = Chat & { otherUser: User; request: ExchangeRequest };

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    if (!user) return;
    try {
      const data = await getChats(user.id);
      setChats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchChats();
  }, []);

  function handleChatPress(chat: ChatWithDetails) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ChatDetail", {
      exchangeRequestId: chat.exchangeRequestId,
      otherUser: chat.otherUser,
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }

  function getStatusColor(status: ExchangeRequest["status"]) {
    switch (status) {
      case "pending":
        return Colors.light.warning;
      case "accepted":
        return Colors.light.success;
      case "completed":
        return Colors.light.success;
      case "rejected":
      case "cancelled":
        return Colors.light.error;
      default:
        return theme.textSecondary;
    }
  }

  function renderChatItem({ item }: { item: ChatWithDetails }) {
    if (!item.otherUser) return null;
    
    const isNeedCash = item.request?.mode === "NEED_CASH";
    const badgeColor = isNeedCash
      ? (isDark ? Colors.dark.needCash : Colors.light.needCash)
      : (isDark ? Colors.dark.haveCash : Colors.light.haveCash);

    return (
      <Card onPress={() => handleChatPress(item)} style={styles.chatCard}>
        <View style={styles.cardContent}>
          <View style={[styles.avatar, { backgroundColor: badgeColor }]}>
            <ThemedText style={styles.avatarText}>
              {item.otherUser.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <ThemedText style={styles.chatName}>{item.otherUser.name}</ThemedText>
              {item.lastMessage ? (
                <ThemedText style={[styles.chatTime, { color: theme.textSecondary }]}>
                  {formatTime(item.lastMessage.createdAt)}
                </ThemedText>
              ) : null}
            </View>
            <View style={styles.chatPreview}>
              {item.lastMessage ? (
                <ThemedText style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.lastMessage.content}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.lastMessage, { color: theme.textSecondary }]}>
                  No messages yet
                </ThemedText>
              )}
            </View>
            {item.request ? (
              <View style={styles.requestInfo}>
                <ThemedText style={[styles.amount, { color: isDark ? Colors.dark.accent : Colors.light.accent }]}>
                  {"\u20B9"}{item.request.amount.toLocaleString("en-IN")}
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.request.status) + "20" }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(item.request.status) }]}>
                    {item.request.status.charAt(0).toUpperCase() + item.request.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    );
  }

  function renderEmpty() {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="message-circle" size={64} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { marginTop: Spacing.xl }]}>
          No conversations yet
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Start by requesting an exchange with someone nearby
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
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
    gap: Spacing.sm,
  },
  chatCard: {
    padding: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
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
  chatInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    ...Typography.body,
    fontWeight: "600",
  },
  chatTime: {
    ...Typography.caption,
  },
  chatPreview: {
    marginTop: Spacing.xs,
  },
  lastMessage: {
    ...Typography.small,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  amount: {
    ...Typography.body,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: "500",
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
