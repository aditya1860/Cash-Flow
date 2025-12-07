import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getMessages, sendMessage as sendApiMessage } from "@/lib/api";
import type { ChatMessage } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "ChatDetail">;

export default function ChatDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { exchangeRequestId, otherUser } = route.params;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <ThemedText style={styles.headerName}>{otherUser.name}</ThemedText>
          <View style={styles.onlineIndicator}>
            <View style={[styles.onlineDot, { backgroundColor: otherUser.isOnline ? Colors.light.success : theme.textSecondary }]} />
            <ThemedText style={[styles.onlineText, { color: theme.textSecondary }]}>
              {otherUser.isOnline ? "Online" : "Offline"}
            </ThemedText>
          </View>
        </View>
      ),
    });
  }, [navigation, otherUser]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    if (!user) return;
    try {
      const data = await getMessages(user.id, exchangeRequestId);
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!message.trim() || !user || isSending) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const newMessage = await sendApiMessage(user.id, exchangeRequestId, content);
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error(error);
      setMessage(content);
    } finally {
      setIsSending(false);
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isOwn = item.senderId === user?.id;
    const accentColor = isDark ? Colors.dark.accent : Colors.light.accent;

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? [styles.messageBubbleOwn, { backgroundColor: accentColor }]
              : [styles.messageBubbleOther, { backgroundColor: theme.backgroundDefault }],
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: isOwn ? "#FFFFFF" : theme.text },
            ]}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            style={[
              styles.messageTime,
              { color: isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Feather name="message-circle" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          No messages yet. Start the conversation!
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundDefault }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || isSending}
            style={[
              styles.sendButton,
              {
                backgroundColor: message.trim()
                  ? (isDark ? Colors.dark.accent : Colors.light.accent)
                  : theme.backgroundSecondary,
              },
            ]}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Feather name="send" size={20} color={message.trim() ? "#FFFFFF" : theme.textSecondary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitle: {
    alignItems: "center",
  },
  headerName: {
    ...Typography.body,
    fontWeight: "600",
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    ...Typography.caption,
  },
  messageList: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  messageBubbleOwn: {
    borderBottomRightRadius: Spacing.xs,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    ...Typography.body,
  },
  messageTime: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  emptyContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  input: {
    ...Typography.body,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
