import { View, Text, StyleSheet } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CashSwap 🔐</Text>
      <Text style={styles.subtitle}>Login Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#38bdf8",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#e5e7eb",
    marginTop: 10,
  },
});
