import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SkillCalc() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Skill Calculator</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  text: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
  },
});
