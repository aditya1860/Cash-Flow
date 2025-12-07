import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, FlatList, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { getNearbyUsers } from "@/lib/api";
import type { NearbyUser } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permission, requestPermission] = Location.useForegroundPermissions();

  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useEffect(() => {
    if (permission?.granted) {
      fetchLocation();
    }
  }, [permission]);

  async function fetchLocation() {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      fetchNearbyUsers(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      setLocation({ latitude: 12.9716, longitude: 77.5946 });
      fetchNearbyUsers(12.9716, 77.5946);
    }
  }

  async function fetchNearbyUsers(lat: number, lng: number) {
    if (!user) return;
    setIsLoading(true);
    try {
      const users = await getNearbyUsers(user.id, lat, lng, 10);
      setNearbyUsers(users);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewExchange() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSpring(0.9, {}, () => {
      fabScale.value = withSpring(1);
    });
    navigation.navigate("NewExchange");
  }

  function handleUserPress(nearbyUser: NearbyUser) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UserProfile", { user: nearbyUser });
  }

  function renderUserPin(nearbyUser: NearbyUser, index: number) {
    const isNeedCash = nearbyUser.location.mode === "NEED_CASH";
    const pinColor = isNeedCash
      ? (isDark ? Colors.dark.needCash : Colors.light.needCash)
      : (isDark ? Colors.dark.haveCash : Colors.light.haveCash);
    
    const pinSize = nearbyUser.location.amount < 500 ? 32 : nearbyUser.location.amount < 2000 ? 40 : 48;
    
    const posX = 50 + (Math.sin(index * 1.5) * 30);
    const posY = 30 + (index * 8);

    return (
      <Pressable
        key={nearbyUser.id}
        onPress={() => handleUserPress(nearbyUser)}
        style={[
          styles.mapPin,
          {
            left: `${posX}%`,
            top: `${posY}%`,
            width: pinSize,
            height: pinSize,
            backgroundColor: pinColor,
          },
        ]}
      >
        <Feather name="dollar-sign" size={pinSize * 0.5} color="#FFFFFF" />
      </Pressable>
    );
  }

  function renderNearbyCard({ item }: { item: NearbyUser }) {
    const isNeedCash = item.location.mode === "NEED_CASH";
    const badgeColor = isNeedCash
      ? (isDark ? Colors.dark.needCash : Colors.light.needCash)
      : (isDark ? Colors.dark.haveCash : Colors.light.haveCash);

    return (
      <Card onPress={() => handleUserPress(item)} style={styles.nearbyCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: badgeColor }]}>
            <ThemedText style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.cardInfo}>
            <ThemedText style={styles.cardName}>{item.name}</ThemedText>
            <View style={styles.cardMeta}>
              <Feather name="star" size={12} color={Colors.light.warning} />
              <ThemedText style={[styles.cardRating, { color: theme.textSecondary }]}>
                {item.rating.toFixed(1)}
              </ThemedText>
              <ThemedText style={[styles.cardDistance, { color: theme.textSecondary }]}>
                {item.distance} km away
              </ThemedText>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <ThemedText style={styles.badgeText}>
              {isNeedCash ? "Needs" : "Has"}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.cardAmount}>
          {"\u20B9"}{item.location.amount.toLocaleString("en-IN")}
        </ThemedText>
      </Card>
    );
  }

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Feather name="map-pin" size={64} color={theme.textSecondary} />
        <ThemedText style={[styles.permissionTitle, { marginTop: Spacing.xl }]}>
          Location Access Required
        </ThemedText>
        <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
          CashSwap needs your location to find nearby exchange partners
        </ThemedText>
        <Pressable
          onPress={requestPermission}
          style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent }]}
        >
          <ThemedText style={styles.permissionButtonText}>Enable Location</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.mapContainer, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.headerBlur}>
            <HeaderTitle title="CashSwap" />
          </BlurView>
        </View>

        <View style={styles.mapPlaceholder}>
          {nearbyUsers.map((u, i) => renderUserPin(u, i))}
          
          <View style={[styles.currentLocation, { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent }]}>
            <View style={styles.currentLocationInner} />
          </View>

          {Platform.OS === "web" ? (
            <View style={styles.webMapNotice}>
              <Feather name="info" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.webMapText, { color: theme.textSecondary }]}>
                Open in Expo Go to view full map
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: tabBarHeight + Spacing.lg, backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <ThemedText style={styles.sheetTitle}>
            {nearbyUsers.length} users nearby
          </ThemedText>
          <ThemedText style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
            Within 10km radius
          </ThemedText>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" style={{ marginTop: Spacing.lg }} />
        ) : (
          <FlatList
            data={nearbyUsers.slice(0, 5)}
            renderItem={renderNearbyCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardList}
          />
        )}
      </View>

      <Animated.View style={[styles.fab, fabAnimatedStyle, { bottom: tabBarHeight + Spacing["5xl"] }]}>
        <Pressable
          onPress={handleNewExchange}
          style={[styles.fabButton, { backgroundColor: isDark ? Colors.dark.accent : Colors.light.accent }]}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  mapContainer: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    position: "relative",
  },
  mapPin: {
    position: "absolute",
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.card,
  },
  currentLocation: {
    position: "absolute",
    left: "48%",
    top: "45%",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  webMapNotice: {
    position: "absolute",
    bottom: Spacing["4xl"],
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: BorderRadius.sm,
  },
  webMapText: {
    ...Typography.small,
  },
  bottomSheet: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Typography.h4,
  },
  sheetSubtitle: {
    ...Typography.small,
  },
  cardList: {
    gap: Spacing.md,
  },
  nearbyCard: {
    width: SCREEN_WIDTH * 0.7,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  cardName: {
    ...Typography.body,
    fontWeight: "600",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  cardRating: {
    ...Typography.caption,
  },
  cardDistance: {
    ...Typography.caption,
    marginLeft: Spacing.sm,
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
  cardAmount: {
    ...Typography.amount,
    marginTop: Spacing.xs,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.fab,
  },
  permissionTitle: {
    ...Typography.h3,
    textAlign: "center",
  },
  permissionText: {
    ...Typography.body,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
});
