import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CashSwap 💸</Text>
      <Text style={styles.subtitle}>
        App is running successfully 🚀
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#38bdf8",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#e5e7eb",
  },
});
