import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import OtpScreen from "@/screens/OtpScreen";
import SetupProfileScreen from "@/screens/SetupProfileScreen";
import NewExchangeScreen from "@/screens/NewExchangeScreen";
import ChatDetailScreen from "@/screens/ChatDetailScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import type { User, NearbyUser, ExchangeRequest, Chat } from "@shared/schema";

export type RootStackParamList = {
  Login: undefined;
  Otp: { phone: string };
  SetupProfile: undefined;
  Main: undefined;
  NewExchange: undefined;
  ChatDetail: { exchangeRequestId: string; otherUser: User };
  UserProfile: { user: NearbyUser };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  const needsProfile = isAuthenticated && user && !user.name;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Otp"
            component={OtpScreen}
            options={{ headerTitle: "Verify OTP" }}
          />
        </>
      ) : needsProfile ? (
        <Stack.Screen
          name="SetupProfile"
          component={SetupProfileScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewExchange"
            component={NewExchangeScreen}
            options={{
              presentation: "modal",
              headerTitle: "New Exchange",
            }}
          />
          <Stack.Screen
            name="ChatDetail"
            component={ChatDetailScreen}
            options={{ headerTitle: "" }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{
              presentation: "modal",
              headerTitle: "User Profile",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
