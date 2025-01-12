import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";

interface CustomChipProps {
  icon?: any;
  label: string;
  bgColor?: string;
}

const CustomChip: React.FC<CustomChipProps> = ({ icon, label, bgColor }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.chip, { backgroundColor: bgColor || "red" }]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Image source={icon} style={styles.icon} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.text}>{label}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    overflow: "hidden",
  },
  iconContainer: {
    marginLeft: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  textContainer: {
    paddingVertical: 2,
    paddingLeft: 6,
    paddingRight: 6,
  },
  text: {
    color: "#ffffff",
    textTransform: "capitalize",
    fontSize: 12,
  },
});

export default CustomChip;
